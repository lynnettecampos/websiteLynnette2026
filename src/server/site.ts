import { DEFAULT_SITE_CONTENT } from "@/content/site";
import type { SiteContent, SiteCopy } from "@/domain/site";
import type { LocaleText } from "@/lib/i18n";
import { buildCloudinaryVideoUrl } from "@/server/cloudinary";
import { getMongoDatabase } from "@/server/mongodb";

const COLLECTION = "siteContent";
const DOCUMENT_ID = "global";

const FONT_SIZE_MAP: Record<string, string> = {
  "1": "0.75rem",
  "2": "0.875rem",
  "3": "1rem",
  "4": "1.125rem",
  "5": "1.25rem",
  "6": "1.5rem",
  "7": "1.875rem",
};

const normalizeRichText = (value: string): string => {
  if (!value) return value;

  const withSpanFonts = value.replace(/<font([^>]*)>/gi, (_, attributes) => {
    const sizeMatch = attributes.match(/size=["']?(\d)["']?/i);
    const colorMatch = attributes.match(/color=["']?([^"'>]+)["']?/i);
    const styleMatch = attributes.match(/style=["']?([^"']+)["']?/i);
    const styles: string[] = [];

    if (sizeMatch?.[1]) {
      const mappedSize = FONT_SIZE_MAP[sizeMatch[1]];
      if (mappedSize) {
        styles.push(`font-size: ${mappedSize}`);
      }
    }

    if (colorMatch?.[1]) {
      styles.push(`color: ${colorMatch[1]}`);
    }

    if (styleMatch?.[1]) {
      styles.push(styleMatch[1]);
    }

    const styleAttr = styles.length > 0 ? ` style="${styles.join("; ")}"` : "";
    return `<span${styleAttr}>`;
  });

  return withSpanFonts.replace(/<\/font>/gi, "</span>");
};

const normalizeLocaleText = (value: LocaleText): LocaleText => ({
  es: normalizeRichText(value.es.trim()),
  en: normalizeRichText(value.en.trim()),
});

const normalizeLocaleList = (values: LocaleText[] | undefined): LocaleText[] =>
  (values ?? []).map(normalizeLocaleText).filter((item) => item.es.length > 0 || item.en.length > 0);

const normalizeOptionalPath = (value?: string): string | undefined => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : undefined;
};

const normalizeSiteGallery = (
  values: SiteCopy["servicesPage"]["gallery"] | undefined,
): SiteCopy["servicesPage"]["gallery"] =>
  (values ?? [])
    .map((item) => ({
      src: item.src.trim(),
      alt: normalizeLocaleText(item.alt),
    }))
    .filter((item) => item.src.length > 0);

const normalizeHeroVideo = (
  value: SiteCopy["home"]["heroVideo"],
): SiteCopy["home"]["heroVideo"] | undefined => {
  if (!value) return undefined;

  const urlCandidate = value.url?.trim();
  const publicId = value.publicId?.trim();
  const poster = value.poster?.trim();
  const resolvedUrl = urlCandidate || (publicId ? buildCloudinaryVideoUrl(publicId) ?? "" : "");

  if (!resolvedUrl && !poster) {
    return undefined;
  }

  return {
    url: resolvedUrl || undefined,
    publicId: publicId || undefined,
    poster: poster || undefined,
  };
};

const normalizeSiteCopy = (value: SiteCopy): SiteCopy => ({
  navigation: {
    brand: normalizeLocaleText(value.navigation.brand),
    homeLabel: normalizeLocaleText(value.navigation.homeLabel),
    bioLabel: normalizeLocaleText(value.navigation.bioLabel),
    servicesLabel: normalizeLocaleText(value.navigation.servicesLabel),
    clientsLabel: normalizeLocaleText(value.navigation.clientsLabel),
    projectsLabel: normalizeLocaleText(value.navigation.projectsLabel),
    eventsLabel: normalizeLocaleText(value.navigation.eventsLabel),
    publicationsLabel: normalizeLocaleText(value.navigation.publicationsLabel),
    contactLabel: normalizeLocaleText(value.navigation.contactLabel),
    openMenuLabel: normalizeLocaleText(value.navigation.openMenuLabel),
    closeMenuLabel: normalizeLocaleText(value.navigation.closeMenuLabel),
  },
  home: {
    heroHeadline: normalizeLocaleText(value.home.heroHeadline),
    heroSubtitle: normalizeLocaleText(value.home.heroSubtitle),
    heroPrimaryCta: normalizeLocaleText(value.home.heroPrimaryCta),
    heroSecondaryCta: normalizeLocaleText(value.home.heroSecondaryCta),
    heroTags: normalizeLocaleList(value.home.heroTags),
    heroVideo: normalizeHeroVideo(value.home.heroVideo),
    servicesTitle: normalizeLocaleText(value.home.servicesTitle),
    servicesCopy: normalizeLocaleText(value.home.servicesCopy),
    servicesCta: normalizeLocaleText(value.home.servicesCta),
    servicesTags: normalizeLocaleList(value.home.servicesTags),
    servicesBadgeLabel: normalizeLocaleText(value.home.servicesBadgeLabel),
    servicesCardCta: normalizeLocaleText(value.home.servicesCardCta),
    projectsTitle: normalizeLocaleText(value.home.projectsTitle),
    projectsDescription: normalizeLocaleText(value.home.projectsDescription),
    projectsTags: normalizeLocaleList(value.home.projectsTags),
    projectsBadgeLabel: normalizeLocaleText(value.home.projectsBadgeLabel),
    projectsCardCta: normalizeLocaleText(value.home.projectsCardCta),
    projectsImageAlt: normalizeLocaleText(value.home.projectsImageAlt),
    projectsCta: normalizeLocaleText(value.home.projectsCta),
    clientsTitle: normalizeLocaleText(value.home.clientsTitle),
    clientsWebsiteLabel: normalizeLocaleText(value.home.clientsWebsiteLabel),
    contactCta: normalizeLocaleText(value.home.contactCta),
  },
  projectsPage: {
    title: normalizeLocaleText(value.projectsPage.title),
    copy: normalizeLocaleText(value.projectsPage.copy),
    filterAllLabel: normalizeLocaleText(value.projectsPage.filterAllLabel),
    emptyState: normalizeLocaleText(value.projectsPage.emptyState),
    cardCta: normalizeLocaleText(value.projectsPage.cardCta),
    ctaTitle: normalizeLocaleText(value.projectsPage.ctaTitle),
    ctaDescription: normalizeLocaleText(value.projectsPage.ctaDescription),
    ctaAction: normalizeLocaleText(value.projectsPage.ctaAction),
  },
  bioPage: {
    title: normalizeLocaleText(value.bioPage.title),
    pending: normalizeLocaleText(value.bioPage.pending),
    cvLabel: normalizeLocaleText(value.bioPage.cvLabel),
  },
  eventsPage: {
    title: normalizeLocaleText(value.eventsPage.title),
    introduction: normalizeLocaleText(value.eventsPage.introduction),
    upcomingTitle: normalizeLocaleText(value.eventsPage.upcomingTitle),
    pastTitle: normalizeLocaleText(value.eventsPage.pastTitle),
    emptyUpcoming: normalizeLocaleText(value.eventsPage.emptyUpcoming),
    emptyPast: normalizeLocaleText(value.eventsPage.emptyPast),
    detailsLabel: normalizeLocaleText(value.eventsPage.detailsLabel),
  },
  publicationsPage: {
    title: normalizeLocaleText(value.publicationsPage.title),
    introduction: normalizeLocaleText(value.publicationsPage.introduction),
    empty: normalizeLocaleText(value.publicationsPage.empty),
    openLabel: normalizeLocaleText(value.publicationsPage.openLabel),
    downloadLabel: normalizeLocaleText(value.publicationsPage.downloadLabel),
  },
  clientsPage: {
    title: normalizeLocaleText(value.clientsPage.title),
    copy: normalizeLocaleText(value.clientsPage.copy),
    imageSrc: normalizeOptionalPath(value.clientsPage.imageSrc),
    imageAlt: normalizeLocaleText(value.clientsPage.imageAlt),
    websiteLabel: normalizeLocaleText(value.clientsPage.websiteLabel),
  },
  servicesPage: {
    title: normalizeLocaleText(value.servicesPage.title),
    copy: normalizeLocaleText(value.servicesPage.copy),
    ctaLabel: normalizeLocaleText(value.servicesPage.ctaLabel),
    chips: normalizeLocaleList(value.servicesPage.chips),
    outcomesLabel: normalizeLocaleText(value.servicesPage.outcomesLabel),
    quickMapLabel: normalizeLocaleText(value.servicesPage.quickMapLabel),
    highlightPrimaryLabel: normalizeLocaleText(value.servicesPage.highlightPrimaryLabel),
    highlightSecondaryLabel: normalizeLocaleText(value.servicesPage.highlightSecondaryLabel),
    sessionTitle: normalizeLocaleText(value.servicesPage.sessionTitle),
    sessionCopy: normalizeLocaleText(value.servicesPage.sessionCopy),
    talkCtaLabel: normalizeLocaleText(value.servicesPage.talkCtaLabel),
    backToTopLabel: normalizeLocaleText(value.servicesPage.backToTopLabel),
    imageSrc: normalizeOptionalPath(value.servicesPage.imageSrc),
    imageAlt: normalizeLocaleText(value.servicesPage.imageAlt),
    gallery: normalizeSiteGallery(value.servicesPage.gallery),
  },
  contact: {
    title: normalizeLocaleText(value.contact.title),
    copy: normalizeLocaleText(value.contact.copy),
    email: value.contact.email.trim(),
    preparation: normalizeLocaleList(value.contact.preparation),
    bookCallTitle: normalizeLocaleText(value.contact.bookCallTitle),
    bookCallCopy: normalizeLocaleText(value.contact.bookCallCopy),
    bookCallCta: normalizeLocaleText(value.contact.bookCallCta),
    preparationTitle: normalizeLocaleText(value.contact.preparationTitle),
    formTitle: normalizeLocaleText(value.contact.formTitle),
    formSubtitle: normalizeLocaleText(value.contact.formSubtitle),
    successLabel: normalizeLocaleText(value.contact.successLabel),
    nameLabel: normalizeLocaleText(value.contact.nameLabel),
    emailLabel: normalizeLocaleText(value.contact.emailLabel),
    organizationLabel: normalizeLocaleText(value.contact.organizationLabel),
    phoneLabel: normalizeLocaleText(value.contact.phoneLabel),
    subjectLabel: normalizeLocaleText(value.contact.subjectLabel),
    messageLabel: normalizeLocaleText(value.contact.messageLabel),
    submitLabel: normalizeLocaleText(value.contact.submitLabel),
    sendingLabel: normalizeLocaleText(value.contact.sendingLabel),
    moreContactTitle: normalizeLocaleText(value.contact.moreContactTitle),
    moreContactLabel: normalizeLocaleText(value.contact.moreContactLabel),
    moreContactNote: normalizeLocaleText(value.contact.moreContactNote),
    imageSrc: normalizeOptionalPath(value.contact.imageSrc),
    imageAlt: normalizeLocaleText(value.contact.imageAlt),
  },
  footer: {
    tagline: normalizeLocaleText(value.footer.tagline),
    adminLabel: normalizeLocaleText(value.footer.adminLabel),
    instagramLabel: normalizeLocaleText(value.footer.instagramLabel),
    instagramUrl: value.footer.instagramUrl?.trim() ?? "",
    facebookLabel: normalizeLocaleText(value.footer.facebookLabel),
    facebookUrl: value.footer.facebookUrl?.trim() ?? "",
    linkedinLabel: normalizeLocaleText(value.footer.linkedinLabel),
    linkedinUrl: value.footer.linkedinUrl?.trim() ?? "",
  },
  services: value.services.map((service) => ({
    ...service,
    slug: service.slug.trim(),
    title: normalizeLocaleText(service.title),
    summary: normalizeLocaleText(service.summary),
    outcomes: normalizeLocaleList(service.outcomes),
    gallery: (service.gallery ?? [])
      .map((image) => ({
        src: image.src.trim(),
        alt: normalizeLocaleText(image.alt),
      }))
      .filter((image) => image.src.length > 0),
  })),
});

const mergeSiteCopy = (payload: Partial<SiteCopy>): SiteCopy => ({
  navigation: {
    ...DEFAULT_SITE_CONTENT.navigation,
    ...(payload.navigation ?? {}),
  },
  home: {
    ...DEFAULT_SITE_CONTENT.home,
    ...(payload.home ?? {}),
  },
  projectsPage: {
    ...DEFAULT_SITE_CONTENT.projectsPage,
    ...(payload.projectsPage ?? {}),
  },
  bioPage: {
    ...DEFAULT_SITE_CONTENT.bioPage,
    ...(payload.bioPage ?? {}),
  },
  eventsPage: {
    ...DEFAULT_SITE_CONTENT.eventsPage,
    ...(payload.eventsPage ?? {}),
  },
  publicationsPage: {
    ...DEFAULT_SITE_CONTENT.publicationsPage,
    ...(payload.publicationsPage ?? {}),
  },
  clientsPage: {
    ...DEFAULT_SITE_CONTENT.clientsPage,
    ...(payload.clientsPage ?? {}),
  },
  servicesPage: {
    ...DEFAULT_SITE_CONTENT.servicesPage,
    ...(payload.servicesPage ?? {}),
  },
  contact: {
    ...DEFAULT_SITE_CONTENT.contact,
    ...(payload.contact ?? {}),
  },
  footer: {
    ...DEFAULT_SITE_CONTENT.footer,
    ...(payload.footer ?? {}),
  },
  services: payload.services ?? DEFAULT_SITE_CONTENT.services,
});

export const fetchSiteContent = async (): Promise<SiteContent | null> => {
  const db = await getMongoDatabase();

  if (!db) {
    return null;
  }

  const document = await db.collection<SiteContent>(COLLECTION).findOne({ _id: DOCUMENT_ID });

  if (!document) {
    return null;
  }

  return normalizeSiteCopy(mergeSiteCopy(document));
};

export const upsertSiteContent = async (payload: SiteCopy): Promise<SiteContent | null> => {
  const db = await getMongoDatabase();

  if (!db) {
    return null;
  }

  const normalized = normalizeSiteCopy(mergeSiteCopy(payload));

  await db
    .collection<SiteContent>(COLLECTION)
    .updateOne({ _id: DOCUMENT_ID }, { $set: { ...normalized, updatedAt: new Date().toISOString() } }, { upsert: true });

  return { ...normalized, updatedAt: new Date().toISOString() };
};
