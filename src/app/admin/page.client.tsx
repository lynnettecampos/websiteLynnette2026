"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { Client, ClientKind } from "@/content/clients";
import type { Service } from "@/content/services";
import type { ArtistEvent, ArtistProfile, Publication } from "@/domain/artist";
import type {
  LocalizedValue,
  Project,
  ProjectCategory,
  ProjectDescriptionBlock,
  ProjectDescriptionMediaLayout,
} from "@/domain/projects";
import {
  getProjectHomeLabel,
  normalizeProjectHomeColor,
  PROJECT_CATEGORY_LABELS,
  resolveProjectHomeColor,
  translateCategoryLabel,
} from "@/domain/projects";
import type { SiteContent } from "@/domain/site";

import type { LocaleText } from "@/lib/i18n";
import { extractApiErrorMessage } from "@/lib/admin-api";
import {
  MAX_WORD_SEARCH_WORD_LENGTH,
  normalizeWordSearchText,
} from "@/lib/word-search";
import {
  CloudinaryLibraryDialog,
  type CloudinaryAsset,
  type CloudinaryPickerOptions,
  useCloudinaryPicker,
} from "@/components/cloudinary/picker";
import {
  ArtistEventsManager,
  ArtistProfileManager,
  PublicationsManager,
} from "@/components/admin/ArtistContentManagers";

type AdminDashboardProps = {
  clients: Client[];
  projects: Project[];
  siteContent: SiteContent;
  artistProfile: ArtistProfile;
  events: ArtistEvent[];
  publications: Publication[];
  databaseReady: boolean;
  cloudinaryReady: boolean;
};

type LocaleField = { es: string; en: string };

type ImageField = {
  id: string;
  src: string;
  publicId: string;
  alt: LocaleField;
  footnote: LocaleField;
};

type ProjectMetaField = {
  id: string;
  label: LocaleField;
  value: LocaleField;
};

type ProjectDescriptionField = {
  id: string;
  text: LocaleField;
  mediaLayout: ProjectDescriptionMediaLayout | "";
  images: ImageField[];
};

type ProjectVideoField = {
  url: string;
  title: LocaleField;
};

type ServiceField = {
  id: string;
  slug: string;
  title: LocaleField;
  summary: LocaleField;
  outcomes: LocaleField[];
  gallery: SiteGalleryImageField[];
};

type SiteGalleryImageField = {
  id: string;
  src: string;
  alt: LocaleField;
};

type SiteContentField = {
  navigation: {
    brand: LocaleField;
    homeLabel: LocaleField;
    bioLabel: LocaleField;
    servicesLabel: LocaleField;
    clientsLabel: LocaleField;
    projectsLabel: LocaleField;
    eventsLabel: LocaleField;
    publicationsLabel: LocaleField;
    contactLabel: LocaleField;
    openMenuLabel: LocaleField;
    closeMenuLabel: LocaleField;
  };
  home: {
    heroHeadline: LocaleField;
    heroSubtitle: LocaleField;
    heroPrimaryCta: LocaleField;
    heroSecondaryCta: LocaleField;
    heroTags: LocaleField[];
    heroVideo: {
      url: string;
      publicId: string;
      poster: string;
    };
    servicesTitle: LocaleField;
    servicesCopy: LocaleField;
    servicesCta: LocaleField;
    servicesTags: LocaleField[];
    servicesBadgeLabel: LocaleField;
    servicesCardCta: LocaleField;
    projectsTitle: LocaleField;
    projectsDescription: LocaleField;
    projectsTags: LocaleField[];
    projectsBadgeLabel: LocaleField;
    projectsCardCta: LocaleField;
    projectsImageAlt: LocaleField;
    projectsCta: LocaleField;
    clientsTitle: LocaleField;
    clientsWebsiteLabel: LocaleField;
    contactCta: LocaleField;
  };
  servicesPage: {
    title: LocaleField;
    copy: LocaleField;
    ctaLabel: LocaleField;
    chips: LocaleField[];
    outcomesLabel: LocaleField;
    quickMapLabel: LocaleField;
    highlightPrimaryLabel: LocaleField;
    highlightSecondaryLabel: LocaleField;
    sessionTitle: LocaleField;
    sessionCopy: LocaleField;
    talkCtaLabel: LocaleField;
    backToTopLabel: LocaleField;
    imageSrc: string;
    imageAlt: LocaleField;
    gallery: SiteGalleryImageField[];
  };
  projectsPage: {
    title: LocaleField;
    copy: LocaleField;
    filterAllLabel: LocaleField;
    emptyState: LocaleField;
    cardCta: LocaleField;
    ctaTitle: LocaleField;
    ctaDescription: LocaleField;
    ctaAction: LocaleField;
  };
  bioPage: {
    title: LocaleField;
    pending: LocaleField;
    cvLabel: LocaleField;
  };
  eventsPage: {
    title: LocaleField;
    introduction: LocaleField;
    upcomingTitle: LocaleField;
    pastTitle: LocaleField;
    emptyUpcoming: LocaleField;
    emptyPast: LocaleField;
    detailsLabel: LocaleField;
  };
  publicationsPage: {
    title: LocaleField;
    introduction: LocaleField;
    empty: LocaleField;
    openLabel: LocaleField;
    downloadLabel: LocaleField;
  };
  clientsPage: {
    title: LocaleField;
    copy: LocaleField;
    imageSrc: string;
    imageAlt: LocaleField;
    websiteLabel: LocaleField;
  };
  contact: {
    title: LocaleField;
    copy: LocaleField;
    email: string;
    preparation: LocaleField[];
    bookCallTitle: LocaleField;
    bookCallCopy: LocaleField;
    bookCallCta: LocaleField;
    preparationTitle: LocaleField;
    formTitle: LocaleField;
    formSubtitle: LocaleField;
    successLabel: LocaleField;
    nameLabel: LocaleField;
    emailLabel: LocaleField;
    organizationLabel: LocaleField;
    phoneLabel: LocaleField;
    subjectLabel: LocaleField;
    messageLabel: LocaleField;
    submitLabel: LocaleField;
    sendingLabel: LocaleField;
    moreContactTitle: LocaleField;
    moreContactLabel: LocaleField;
    moreContactNote: LocaleField;
    imageSrc: string;
    imageAlt: LocaleField;
  };
  footer: {
    tagline: LocaleField;
    adminLabel: LocaleField;
    instagramLabel: LocaleField;
    instagramUrl: string;
    facebookLabel: LocaleField;
    facebookUrl: string;
    linkedinLabel: LocaleField;
    linkedinUrl: string;
  };
  services: ServiceField[];
};

type SiteContentSection =
  | "navigation"
  | "home"
  | "servicesPage"
  | "projectsPage"
  | "bioPage"
  | "eventsPage"
  | "publicationsPage"
  | "clientsPage"
  | "contact"
  | "footer"
  | "servicesList";

const CLIENT_KINDS: { value: ClientKind; label: string }[] = [
  { value: "client", label: "Persona / cliente" },
  { value: "institution", label: "Institución" },
  { value: "partner", label: "Colaborador" },
];

const createLocaleField = (value?: LocaleText | LocalizedValue): LocaleField => {
  if (!value) {
    return { es: "", en: "" };
  }

  if (typeof value === "string") {
    return { es: value, en: value };
  }

  return { es: value.es ?? "", en: value.en ?? "" };
};

const createImageField = (
  id: string,
  image?: { src?: string; publicId?: string; alt: LocaleText; footnote?: LocaleText },
): ImageField => ({
  id,
  src: image?.src ?? "",
  publicId: image?.publicId ?? "",
  alt: createLocaleField(image?.alt),
  footnote: createLocaleField(image?.footnote),
});

const createMetaField = (id: string, meta?: { label: LocaleText; value: LocalizedValue }): ProjectMetaField => ({
  id,
  label: createLocaleField(meta?.label),
  value: createLocaleField(meta?.value),
});

const createDescriptionField = (
  id: string,
  value?: LocaleText | ProjectDescriptionBlock,
): ProjectDescriptionField => {
  const block = value && "text" in value ? value : undefined;
  const text = block?.text ?? (value as LocaleText | undefined);

  return {
    id,
    text: createLocaleField(text),
    mediaLayout: block?.media?.layout ?? "",
    images: (block?.media?.images ?? []).map((image) =>
      createImageField(randomId(), image),
    ),
  };
};

const createServiceField = (id: string, service?: Service): ServiceField => ({
  id,
  slug: service?.slug ?? "",
  title: createLocaleField(service?.title),
  summary: createLocaleField(service?.summary),
  outcomes: (service?.outcomes ?? []).map((outcome, index) => createDescriptionField(`${id}-outcome-${index}`, outcome).text),
  gallery: (service?.gallery ?? []).map((image, index) => createSiteGalleryImageField(`${id}-gallery-${index}`, image)),
});

const createSiteGalleryImageField = (
  id: string,
  image?: { src: string; alt: LocaleText },
): SiteGalleryImageField => ({
  id,
  src: image?.src ?? "",
  alt: createLocaleField(image?.alt),
});

const createSiteContentField = (siteContent: SiteContent): SiteContentField => ({
  navigation: {
    brand: createLocaleField(siteContent.navigation.brand),
    homeLabel: createLocaleField(siteContent.navigation.homeLabel),
    bioLabel: createLocaleField(siteContent.navigation.bioLabel),
    servicesLabel: createLocaleField(siteContent.navigation.servicesLabel),
    clientsLabel: createLocaleField(siteContent.navigation.clientsLabel),
    projectsLabel: createLocaleField(siteContent.navigation.projectsLabel),
    eventsLabel: createLocaleField(siteContent.navigation.eventsLabel),
    publicationsLabel: createLocaleField(siteContent.navigation.publicationsLabel),
    contactLabel: createLocaleField(siteContent.navigation.contactLabel),
    openMenuLabel: createLocaleField(siteContent.navigation.openMenuLabel),
    closeMenuLabel: createLocaleField(siteContent.navigation.closeMenuLabel),
  },
  home: {
    heroHeadline: createLocaleField(siteContent.home.heroHeadline),
    heroSubtitle: createLocaleField(siteContent.home.heroSubtitle),
    heroPrimaryCta: createLocaleField(siteContent.home.heroPrimaryCta),
    heroSecondaryCta: createLocaleField(siteContent.home.heroSecondaryCta),
    heroTags: (siteContent.home.heroTags || []).map((tag, index) => createDescriptionField(`hero-tag-${index}`, tag).text),
    heroVideo: {
      url: siteContent.home.heroVideo?.url ?? "",
      publicId: siteContent.home.heroVideo?.publicId ?? "",
      poster: siteContent.home.heroVideo?.poster ?? "",
    },
    servicesTitle: createLocaleField(siteContent.home.servicesTitle),
    servicesCopy: createLocaleField(siteContent.home.servicesCopy),
    servicesCta: createLocaleField(siteContent.home.servicesCta),
    servicesTags: (siteContent.home.servicesTags || []).map((tag, index) =>
      createDescriptionField(`services-tag-${index}`, tag).text,
    ),
    servicesBadgeLabel: createLocaleField(siteContent.home.servicesBadgeLabel),
    servicesCardCta: createLocaleField(siteContent.home.servicesCardCta),
    projectsTitle: createLocaleField(siteContent.home.projectsTitle),
    projectsDescription: createLocaleField(siteContent.home.projectsDescription),
    projectsTags: (siteContent.home.projectsTags || []).map((tag, index) =>
      createDescriptionField(`projects-tag-${index}`, tag).text,
    ),
    projectsBadgeLabel: createLocaleField(siteContent.home.projectsBadgeLabel),
    projectsCardCta: createLocaleField(siteContent.home.projectsCardCta),
    projectsImageAlt: createLocaleField(siteContent.home.projectsImageAlt),
    projectsCta: createLocaleField(siteContent.home.projectsCta),
    clientsTitle: createLocaleField(siteContent.home.clientsTitle),
    clientsWebsiteLabel: createLocaleField(siteContent.home.clientsWebsiteLabel),
    contactCta: createLocaleField(siteContent.home.contactCta),
  },
  servicesPage: {
    title: createLocaleField(siteContent.servicesPage.title),
    copy: createLocaleField(siteContent.servicesPage.copy),
    ctaLabel: createLocaleField(siteContent.servicesPage.ctaLabel),
    chips: (siteContent.servicesPage.chips || []).map((chip, index) => createDescriptionField(`chip-${index}`, chip).text),
    outcomesLabel: createLocaleField(siteContent.servicesPage.outcomesLabel),
    quickMapLabel: createLocaleField(siteContent.servicesPage.quickMapLabel),
    highlightPrimaryLabel: createLocaleField(siteContent.servicesPage.highlightPrimaryLabel),
    highlightSecondaryLabel: createLocaleField(siteContent.servicesPage.highlightSecondaryLabel),
    sessionTitle: createLocaleField(siteContent.servicesPage.sessionTitle),
    sessionCopy: createLocaleField(siteContent.servicesPage.sessionCopy),
    talkCtaLabel: createLocaleField(siteContent.servicesPage.talkCtaLabel),
    backToTopLabel: createLocaleField(siteContent.servicesPage.backToTopLabel),
    imageSrc: siteContent.servicesPage.imageSrc ?? "",
    imageAlt: createLocaleField(siteContent.servicesPage.imageAlt),
    gallery: (siteContent.servicesPage.gallery ?? []).map((image, index) =>
      createSiteGalleryImageField(`services-gallery-${index}`, image),
    ),
  },
  projectsPage: {
    title: createLocaleField(siteContent.projectsPage.title),
    copy: createLocaleField(siteContent.projectsPage.copy),
    filterAllLabel: createLocaleField(siteContent.projectsPage.filterAllLabel),
    emptyState: createLocaleField(siteContent.projectsPage.emptyState),
    cardCta: createLocaleField(siteContent.projectsPage.cardCta),
    ctaTitle: createLocaleField(siteContent.projectsPage.ctaTitle),
    ctaDescription: createLocaleField(siteContent.projectsPage.ctaDescription),
    ctaAction: createLocaleField(siteContent.projectsPage.ctaAction),
  },
  bioPage: {
    title: createLocaleField(siteContent.bioPage.title),
    pending: createLocaleField(siteContent.bioPage.pending),
    cvLabel: createLocaleField(siteContent.bioPage.cvLabel),
  },
  eventsPage: {
    title: createLocaleField(siteContent.eventsPage.title),
    introduction: createLocaleField(siteContent.eventsPage.introduction),
    upcomingTitle: createLocaleField(siteContent.eventsPage.upcomingTitle),
    pastTitle: createLocaleField(siteContent.eventsPage.pastTitle),
    emptyUpcoming: createLocaleField(siteContent.eventsPage.emptyUpcoming),
    emptyPast: createLocaleField(siteContent.eventsPage.emptyPast),
    detailsLabel: createLocaleField(siteContent.eventsPage.detailsLabel),
  },
  publicationsPage: {
    title: createLocaleField(siteContent.publicationsPage.title),
    introduction: createLocaleField(siteContent.publicationsPage.introduction),
    empty: createLocaleField(siteContent.publicationsPage.empty),
    openLabel: createLocaleField(siteContent.publicationsPage.openLabel),
    downloadLabel: createLocaleField(siteContent.publicationsPage.downloadLabel),
  },
  clientsPage: {
    title: createLocaleField(siteContent.clientsPage.title),
    copy: createLocaleField(siteContent.clientsPage.copy),
    imageSrc: siteContent.clientsPage.imageSrc ?? "",
    imageAlt: createLocaleField(siteContent.clientsPage.imageAlt),
    websiteLabel: createLocaleField(siteContent.clientsPage.websiteLabel),
  },
  contact: {
    title: createLocaleField(siteContent.contact.title),
    copy: createLocaleField(siteContent.contact.copy),
    email: siteContent.contact.email,
    preparation: (siteContent.contact.preparation || []).map((item, index) =>
      createDescriptionField(`prep-${index}`, item).text,
    ),
    bookCallTitle: createLocaleField(siteContent.contact.bookCallTitle),
    bookCallCopy: createLocaleField(siteContent.contact.bookCallCopy),
    bookCallCta: createLocaleField(siteContent.contact.bookCallCta),
    preparationTitle: createLocaleField(siteContent.contact.preparationTitle),
    formTitle: createLocaleField(siteContent.contact.formTitle),
    formSubtitle: createLocaleField(siteContent.contact.formSubtitle),
    successLabel: createLocaleField(siteContent.contact.successLabel),
    nameLabel: createLocaleField(siteContent.contact.nameLabel),
    emailLabel: createLocaleField(siteContent.contact.emailLabel),
    organizationLabel: createLocaleField(siteContent.contact.organizationLabel),
    phoneLabel: createLocaleField(siteContent.contact.phoneLabel),
    subjectLabel: createLocaleField(siteContent.contact.subjectLabel),
    messageLabel: createLocaleField(siteContent.contact.messageLabel),
    submitLabel: createLocaleField(siteContent.contact.submitLabel),
    sendingLabel: createLocaleField(siteContent.contact.sendingLabel),
    moreContactTitle: createLocaleField(siteContent.contact.moreContactTitle),
    moreContactLabel: createLocaleField(siteContent.contact.moreContactLabel),
    moreContactNote: createLocaleField(siteContent.contact.moreContactNote),
    imageSrc: siteContent.contact.imageSrc ?? "",
    imageAlt: createLocaleField(siteContent.contact.imageAlt),
  },
  footer: {
    tagline: createLocaleField(siteContent.footer.tagline),
    adminLabel: createLocaleField(siteContent.footer.adminLabel),
    instagramLabel: createLocaleField(siteContent.footer.instagramLabel),
    instagramUrl: siteContent.footer.instagramUrl ?? "",
    facebookLabel: createLocaleField(siteContent.footer.facebookLabel),
    facebookUrl: siteContent.footer.facebookUrl ?? "",
    linkedinLabel: createLocaleField(siteContent.footer.linkedinLabel),
    linkedinUrl: siteContent.footer.linkedinUrl ?? "",
  },
  services: siteContent.services.map((service, index) => createServiceField(`service-${index}`, service)),
});

const trimLocaleField = (value: LocaleField): LocaleField => ({
  es: value.es.trim(),
  en: value.en.trim(),
});

const hasLocaleContent = (value: LocaleField): boolean =>
  value.es.trim().length > 0 || value.en.trim().length > 0;

const normalizeOptionalLocaleField = (value: LocaleField): LocaleField | undefined => {
  const trimmed = trimLocaleField(value);

  if (!hasLocaleContent(trimmed)) {
    return undefined;
  }

  return {
    es: trimmed.es || trimmed.en,
    en: trimmed.en || trimmed.es,
  };
};

const localeFieldToText = (value: LocaleField): LocaleText => ({
  es: value.es.trim(),
  en: value.en.trim(),
});

const localeFieldToTextWithFallback = (value: LocaleField): LocaleText => ({
  es: value.es.trim() || value.en.trim(),
  en: value.en.trim() || value.es.trim(),
});

const requireLocaleField = (value: LocaleField, label: string): LocaleText => {
  const normalized = localeFieldToTextWithFallback(trimLocaleField(value));

  if (!normalized.es || !normalized.en) {
    throw new Error(`Agrega ${label} en español o inglés`);
  }

  return normalized;
};

const normalizeLocaleListField = (values: LocaleField[]): LocaleText[] =>
  values
    .map((value) => localeFieldToTextWithFallback(trimLocaleField(value)))
    .filter((item) => item.es.length > 0 && item.en.length > 0);

const imageHasData = (image: ImageField): boolean =>
  image.src.trim().length > 0 || image.publicId.trim().length > 0;

const randomId = () => Math.random().toString(36).slice(2, 10);

const slugifyCategory = (value: string): string => {
  const normalized = value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();

  return normalized || value.trim();
};

const buildSitePayload = (draft: SiteContentField): SiteContent => ({
  navigation: {
    brand: localeFieldToText(trimLocaleField(draft.navigation.brand)),
    homeLabel: localeFieldToText(trimLocaleField(draft.navigation.homeLabel)),
    bioLabel: localeFieldToText(trimLocaleField(draft.navigation.bioLabel)),
    servicesLabel: localeFieldToText(trimLocaleField(draft.navigation.servicesLabel)),
    clientsLabel: localeFieldToText(trimLocaleField(draft.navigation.clientsLabel)),
    projectsLabel: localeFieldToText(trimLocaleField(draft.navigation.projectsLabel)),
    eventsLabel: localeFieldToText(trimLocaleField(draft.navigation.eventsLabel)),
    publicationsLabel: localeFieldToText(trimLocaleField(draft.navigation.publicationsLabel)),
    contactLabel: localeFieldToText(trimLocaleField(draft.navigation.contactLabel)),
    openMenuLabel: localeFieldToText(trimLocaleField(draft.navigation.openMenuLabel)),
    closeMenuLabel: localeFieldToText(trimLocaleField(draft.navigation.closeMenuLabel)),
  },
  home: {
    heroHeadline: localeFieldToText(trimLocaleField(draft.home.heroHeadline)),
    heroSubtitle: localeFieldToText(trimLocaleField(draft.home.heroSubtitle)),
    heroPrimaryCta: localeFieldToText(trimLocaleField(draft.home.heroPrimaryCta)),
    heroSecondaryCta: localeFieldToText(trimLocaleField(draft.home.heroSecondaryCta)),
    heroTags: normalizeLocaleListField(draft.home.heroTags),
    heroVideo:
      draft.home.heroVideo.url.trim() || draft.home.heroVideo.publicId.trim() || draft.home.heroVideo.poster.trim()
        ? {
            url: draft.home.heroVideo.url.trim() || undefined,
            publicId: draft.home.heroVideo.publicId.trim() || undefined,
            poster: draft.home.heroVideo.poster.trim() || undefined,
          }
        : undefined,
    servicesTitle: localeFieldToText(trimLocaleField(draft.home.servicesTitle)),
    servicesCopy: localeFieldToText(trimLocaleField(draft.home.servicesCopy)),
    servicesCta: localeFieldToText(trimLocaleField(draft.home.servicesCta)),
    servicesTags: normalizeLocaleListField(draft.home.servicesTags),
    servicesBadgeLabel: localeFieldToText(trimLocaleField(draft.home.servicesBadgeLabel)),
    servicesCardCta: localeFieldToText(trimLocaleField(draft.home.servicesCardCta)),
    projectsTitle: localeFieldToText(trimLocaleField(draft.home.projectsTitle)),
    projectsDescription: localeFieldToText(trimLocaleField(draft.home.projectsDescription)),
    projectsTags: normalizeLocaleListField(draft.home.projectsTags),
    projectsBadgeLabel: localeFieldToText(trimLocaleField(draft.home.projectsBadgeLabel)),
    projectsCardCta: localeFieldToText(trimLocaleField(draft.home.projectsCardCta)),
    projectsImageAlt: localeFieldToText(trimLocaleField(draft.home.projectsImageAlt)),
    projectsCta: localeFieldToText(trimLocaleField(draft.home.projectsCta)),
    clientsTitle: localeFieldToText(trimLocaleField(draft.home.clientsTitle)),
    clientsWebsiteLabel: localeFieldToText(trimLocaleField(draft.home.clientsWebsiteLabel)),
    contactCta: localeFieldToText(trimLocaleField(draft.home.contactCta)),
  },
  servicesPage: {
    title: localeFieldToText(trimLocaleField(draft.servicesPage.title)),
    copy: localeFieldToText(trimLocaleField(draft.servicesPage.copy)),
    ctaLabel: localeFieldToText(trimLocaleField(draft.servicesPage.ctaLabel)),
    chips: normalizeLocaleListField(draft.servicesPage.chips),
    outcomesLabel: localeFieldToText(trimLocaleField(draft.servicesPage.outcomesLabel)),
    quickMapLabel: localeFieldToText(trimLocaleField(draft.servicesPage.quickMapLabel)),
    highlightPrimaryLabel: localeFieldToText(trimLocaleField(draft.servicesPage.highlightPrimaryLabel)),
    highlightSecondaryLabel: localeFieldToText(trimLocaleField(draft.servicesPage.highlightSecondaryLabel)),
    sessionTitle: localeFieldToText(trimLocaleField(draft.servicesPage.sessionTitle)),
    sessionCopy: localeFieldToText(trimLocaleField(draft.servicesPage.sessionCopy)),
    talkCtaLabel: localeFieldToText(trimLocaleField(draft.servicesPage.talkCtaLabel)),
    backToTopLabel: localeFieldToText(trimLocaleField(draft.servicesPage.backToTopLabel)),
    imageSrc: draft.servicesPage.imageSrc.trim() || undefined,
    imageAlt: localeFieldToText(trimLocaleField(draft.servicesPage.imageAlt)),
    gallery: draft.servicesPage.gallery
      .map((image) => ({
        src: image.src.trim(),
        alt: localeFieldToText(trimLocaleField(image.alt)),
      }))
      .filter((image) => image.src.length > 0),
  },
  projectsPage: {
    title: localeFieldToText(trimLocaleField(draft.projectsPage.title)),
    copy: localeFieldToText(trimLocaleField(draft.projectsPage.copy)),
    filterAllLabel: localeFieldToText(trimLocaleField(draft.projectsPage.filterAllLabel)),
    emptyState: localeFieldToText(trimLocaleField(draft.projectsPage.emptyState)),
    cardCta: localeFieldToText(trimLocaleField(draft.projectsPage.cardCta)),
    ctaTitle: localeFieldToText(trimLocaleField(draft.projectsPage.ctaTitle)),
    ctaDescription: localeFieldToText(trimLocaleField(draft.projectsPage.ctaDescription)),
    ctaAction: localeFieldToText(trimLocaleField(draft.projectsPage.ctaAction)),
  },
  bioPage: {
    title: localeFieldToText(trimLocaleField(draft.bioPage.title)),
    pending: localeFieldToText(trimLocaleField(draft.bioPage.pending)),
    cvLabel: localeFieldToText(trimLocaleField(draft.bioPage.cvLabel)),
  },
  eventsPage: {
    title: localeFieldToText(trimLocaleField(draft.eventsPage.title)),
    introduction: localeFieldToText(trimLocaleField(draft.eventsPage.introduction)),
    upcomingTitle: localeFieldToText(trimLocaleField(draft.eventsPage.upcomingTitle)),
    pastTitle: localeFieldToText(trimLocaleField(draft.eventsPage.pastTitle)),
    emptyUpcoming: localeFieldToText(trimLocaleField(draft.eventsPage.emptyUpcoming)),
    emptyPast: localeFieldToText(trimLocaleField(draft.eventsPage.emptyPast)),
    detailsLabel: localeFieldToText(trimLocaleField(draft.eventsPage.detailsLabel)),
  },
  publicationsPage: {
    title: localeFieldToText(trimLocaleField(draft.publicationsPage.title)),
    introduction: localeFieldToText(trimLocaleField(draft.publicationsPage.introduction)),
    empty: localeFieldToText(trimLocaleField(draft.publicationsPage.empty)),
    openLabel: localeFieldToText(trimLocaleField(draft.publicationsPage.openLabel)),
    downloadLabel: localeFieldToText(trimLocaleField(draft.publicationsPage.downloadLabel)),
  },
  clientsPage: {
    title: localeFieldToText(trimLocaleField(draft.clientsPage.title)),
    copy: localeFieldToText(trimLocaleField(draft.clientsPage.copy)),
    imageSrc: draft.clientsPage.imageSrc.trim() || undefined,
    imageAlt: localeFieldToText(trimLocaleField(draft.clientsPage.imageAlt)),
    websiteLabel: localeFieldToText(trimLocaleField(draft.clientsPage.websiteLabel)),
  },
  contact: {
    title: localeFieldToText(trimLocaleField(draft.contact.title)),
    copy: localeFieldToText(trimLocaleField(draft.contact.copy)),
    email: draft.contact.email.trim(),
    preparation: normalizeLocaleListField(draft.contact.preparation),
    bookCallTitle: localeFieldToText(trimLocaleField(draft.contact.bookCallTitle)),
    bookCallCopy: localeFieldToText(trimLocaleField(draft.contact.bookCallCopy)),
    bookCallCta: localeFieldToText(trimLocaleField(draft.contact.bookCallCta)),
    preparationTitle: localeFieldToText(trimLocaleField(draft.contact.preparationTitle)),
    formTitle: localeFieldToText(trimLocaleField(draft.contact.formTitle)),
    formSubtitle: localeFieldToText(trimLocaleField(draft.contact.formSubtitle)),
    successLabel: localeFieldToText(trimLocaleField(draft.contact.successLabel)),
    nameLabel: localeFieldToText(trimLocaleField(draft.contact.nameLabel)),
    emailLabel: localeFieldToText(trimLocaleField(draft.contact.emailLabel)),
    organizationLabel: localeFieldToText(trimLocaleField(draft.contact.organizationLabel)),
    phoneLabel: localeFieldToText(trimLocaleField(draft.contact.phoneLabel)),
    subjectLabel: localeFieldToText(trimLocaleField(draft.contact.subjectLabel)),
    messageLabel: localeFieldToText(trimLocaleField(draft.contact.messageLabel)),
    submitLabel: localeFieldToText(trimLocaleField(draft.contact.submitLabel)),
    sendingLabel: localeFieldToText(trimLocaleField(draft.contact.sendingLabel)),
    moreContactTitle: localeFieldToText(trimLocaleField(draft.contact.moreContactTitle)),
    moreContactLabel: localeFieldToText(trimLocaleField(draft.contact.moreContactLabel)),
    moreContactNote: localeFieldToText(trimLocaleField(draft.contact.moreContactNote)),
    imageSrc: draft.contact.imageSrc.trim() || undefined,
    imageAlt: localeFieldToText(trimLocaleField(draft.contact.imageAlt)),
  },
  footer: {
    tagline: localeFieldToText(trimLocaleField(draft.footer.tagline)),
    adminLabel: localeFieldToText(trimLocaleField(draft.footer.adminLabel)),
    instagramLabel: localeFieldToText(trimLocaleField(draft.footer.instagramLabel)),
    instagramUrl: draft.footer.instagramUrl.trim(),
    facebookLabel: localeFieldToText(trimLocaleField(draft.footer.facebookLabel)),
    facebookUrl: draft.footer.facebookUrl.trim(),
    linkedinLabel: localeFieldToText(trimLocaleField(draft.footer.linkedinLabel)),
    linkedinUrl: draft.footer.linkedinUrl.trim(),
  },
  services: draft.services.map((service, index) => {
    const normalizedTitle = localeFieldToTextWithFallback(trimLocaleField(service.title));
    const normalizedSummary = localeFieldToTextWithFallback(trimLocaleField(service.summary));

    return {
      slug:
        slugifyCategory(service.slug)
        || slugifyCategory(normalizedTitle.es || normalizedTitle.en)
        || `servicio-${index + 1}`,
      title:
        normalizedTitle.es.length > 0 || normalizedTitle.en.length > 0
          ? normalizedTitle
          : { es: `Servicio ${index + 1}`, en: `Service ${index + 1}` },
      summary:
        normalizedSummary.es.length > 0 || normalizedSummary.en.length > 0
          ? normalizedSummary
          : { es: "Descripción pendiente", en: "Pending description" },
      outcomes: normalizeLocaleListField(service.outcomes),
      gallery: service.gallery
        .map((image, imageIndex) => {
          const normalizedAlt = localeFieldToTextWithFallback(trimLocaleField(image.alt));

          return {
            src: image.src.trim(),
            alt:
              normalizedAlt.es.length > 0 || normalizedAlt.en.length > 0
                ? normalizedAlt
                : {
                  es: `Imagen ${imageIndex + 1} del servicio ${index + 1}`,
                  en: `Image ${imageIndex + 1} for service ${index + 1}`,
                },
          };
        })
        .filter((image) => image.src.length > 0),
    };
  }),
});

const uploadToCloudinary = async (file: File, folder: string) => {
  const formData = new FormData();
  formData.append("file", file);

  if (folder.trim().length > 0) {
    formData.append("folder", folder);
  }

  const response = await fetch("/api/uploads", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(extractApiErrorMessage(data, "Cloudinary rechazó la carga"));
  }

  const payload = (await response.json()) as { publicId: string; src: string };

  return payload;
};

const CloudinaryLibraryShortcut = ({
  cloudinaryReady,
  openCloudinaryPicker,
}: {
  cloudinaryReady: boolean;
  openCloudinaryPicker?: (options: CloudinaryPickerOptions) => void;
}) => {
  const [message, setMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const copyUrlMessage = useCallback(async (url: string, label: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setMessage(`Se copió la URL de “${label}” al portapapeles. Pégala en el campo que prefieras.`);
        return;
      } catch {
        // Fall through to manual copy message.
      }
    }

    setMessage(`Seleccionaste “${label}”. Copia manualmente esta URL: ${url || "sin URL pública"}`);
  }, []);

  const handleSelect = useCallback(
    (asset: CloudinaryAsset) => {
      const label = asset.publicId || asset.url;
      void copyUrlMessage(asset.url, label);
    },
    [copyUrlMessage],
  );

  const handleUploadFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) {
        return;
      }

      try {
        setIsUploading(true);
        const uploaded = await uploadToCloudinary(file, "library");
        await copyUrlMessage(uploaded.src, uploaded.publicId || uploaded.src);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "No fue posible cargar el archivo en la biblioteca.",
        );
      } finally {
        setIsUploading(false);
        if (uploadInputRef.current) {
          uploadInputRef.current.value = "";
        }
      }
    },
    [copyUrlMessage],
  );

  if (!cloudinaryReady || !openCloudinaryPicker) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-foreground/10 bg-foreground/5 p-6">
      <div className="space-y-4">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground/90">Biblioteca de imágenes</h2>
          <p className="text-sm text-foreground/60">
            Abre la biblioteca de Cloudinary para reutilizar logos, mockups y capturas sin volver a subirlos.
          </p>
        </header>

        {message && (
          <p className="rounded-2xl border border-foreground/10 bg-background px-4 py-3 text-sm text-foreground/70">
            {message}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => openCloudinaryPicker({ onSelect: handleSelect })}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background transition hover:bg-foreground/90"
          >
            Abrir biblioteca
          </button>
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(event) => void handleUploadFile(event)}
          />
          <button
            type="button"
            onClick={() => uploadInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-2 rounded-full border border-foreground/20 px-5 py-2 text-sm font-semibold text-foreground/80 transition hover:border-foreground/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? "Cargando..." : "Cargar archivo"}
          </button>
          <p className="text-xs text-foreground/60">
            Al seleccionar una imagen o cargar un archivo se copiará su URL segura al portapapeles para pegarla en
            cualquier formulario.
          </p>
        </div>
      </div>
    </section>
  );
};

const RichTextInput = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof document !== "undefined") {
      // Ensure formatting commands emit inline CSS styles for consistency across browsers.
      document.execCommand("styleWithCSS", false, "true");
    }
  }, []);

  const syncContent = useCallback(() => {
    const html = editorRef.current?.innerHTML ?? "";
    onChange(html);
  }, [onChange]);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== value) {
      editor.innerHTML = value || "";
    }
  }, [value]);

  const exec = useCallback((command: string, arg?: string) => {
    if (typeof document === "undefined") return;
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    syncContent();
  }, [syncContent]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-foreground/10 bg-foreground/5 px-3 py-2 text-xs font-semibold text-foreground/70">
        <button
          type="button"
          onClick={() => exec("bold")}
          className="rounded-lg px-2 py-1 transition hover:bg-foreground/10"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => exec("italic")}
          className="rounded-lg px-2 py-1 transition hover:bg-foreground/10"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => exec("underline")}
          className="rounded-lg px-2 py-1 transition hover:bg-foreground/10"
        >
          U
        </button>
        <select
          className="rounded-lg border border-foreground/10 bg-background px-2 py-1 text-xs"
          onChange={(event) => exec("fontSize", event.target.value)}
          defaultValue=""
        >
          <option value="">Tamaño</option>
          <option value="2">Pequeño</option>
          <option value="3">Base</option>
          <option value="4">Grande</option>
          <option value="5">Muy grande</option>
        </select>
        <label className="flex items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-foreground/10">
          <span>Color</span>
          <input type="color" onChange={(event) => exec("foreColor", event.target.value)} />
        </label>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[120px] w-full rounded-2xl border border-foreground/10 bg-background px-3 py-2 text-sm leading-relaxed focus:border-foreground/40 focus:outline-none"
        onInput={syncContent}
        data-placeholder={placeholder}
      />
    </div>
  );
};

const RichLocaleInputs = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: LocaleField;
  onChange: (value: LocaleField) => void;
  placeholder?: string;
}) => (
  <div className="space-y-2">
    <p className="text-sm font-semibold text-foreground/80">{label}</p>
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1 text-sm text-foreground/70">
        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-foreground/50">ES</span>
        <RichTextInput value={value.es} onChange={(content) => onChange({ ...value, es: content })} placeholder={placeholder} />
      </div>
      <div className="space-y-1 text-sm text-foreground/70">
        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-foreground/50">EN</span>
        <RichTextInput value={value.en} onChange={(content) => onChange({ ...value, en: content })} placeholder={placeholder} />
      </div>
    </div>
  </div>
);

const PlainLocaleInputs = ({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: LocaleField;
  onChange: (value: LocaleField) => void;
  multiline?: boolean;
}) => {
  const sharedClassName =
    "w-full rounded-xl border border-foreground/10 bg-background px-3 py-2 text-sm leading-relaxed outline-none transition focus:border-foreground/40";

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-foreground/80">{label}</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        {(["es", "en"] as const).map((language) => (
          <label key={language} className="space-y-1 text-sm text-foreground/70">
            <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-foreground/50">
              {language}
            </span>
            {multiline ? (
              <textarea
                rows={4}
                className={`${sharedClassName} resize-y`}
                value={value[language]}
                onChange={(event) => onChange({ ...value, [language]: event.target.value })}
              />
            ) : (
              <input
                className={sharedClassName}
                value={value[language]}
                onChange={(event) => onChange({ ...value, [language]: event.target.value })}
              />
            )}
          </label>
        ))}
      </div>
    </fieldset>
  );
};

const LocaleListEditor = ({
  label,
  values,
  onChange,
  addLabel,
}: {
  label: string;
  values: LocaleField[];
  onChange: (values: LocaleField[]) => void;
  addLabel?: string;
}) => (
  <div className="space-y-2">
    <p className="text-sm font-semibold text-foreground/80">{label}</p>
    <div className="space-y-3">
      {values.map((item, index) => (
        <div key={`${label}-${index}`} className="rounded-2xl border border-foreground/10 bg-background px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.14em] text-foreground/60">{String(index + 1).padStart(2, "0")}</p>
            <button
              type="button"
              onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}
              className="text-xs font-semibold text-foreground/50 hover:text-foreground"
            >
              {"Eliminar"}
            </button>
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <input
              className="w-full rounded-xl border border-foreground/10 bg-background px-3 py-2 text-sm"
              placeholder="Texto ES"
              value={item.es}
              onChange={(event) => {
                const next = [...values];
                next[index] = { ...item, es: event.target.value };
                onChange(next);
              }}
            />
            <input
              className="w-full rounded-xl border border-foreground/10 bg-background px-3 py-2 text-sm"
              placeholder="Texto EN"
              value={item.en}
              onChange={(event) => {
                const next = [...values];
                next[index] = { ...item, en: event.target.value };
                onChange(next);
              }}
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...values, { es: "", en: "" }])}
        className="inline-flex items-center gap-2 rounded-full border border-foreground/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/70 hover:border-foreground/30"
      >
        {addLabel ?? "Agregar"}
      </button>
    </div>
  </div>
);

const ServiceEditor = ({
  service,
  onChange,
  onRemove,
  cloudinaryReady,
  openCloudinaryPicker,
}: {
  service: ServiceField;
  onChange: (value: ServiceField) => void;
  onRemove: () => void;
  cloudinaryReady: boolean;
  openCloudinaryPicker?: (options: CloudinaryPickerOptions) => void;
}) => {
  const [uploadingGalleryId, setUploadingGalleryId] = useState<string | null>(null);

  return (
    <div className="space-y-3 rounded-3xl border border-foreground/10 bg-background/70 p-4">
    <div className="flex items-center justify-between gap-2">
      <p className="text-sm font-semibold text-foreground/80">Servicio</p>
      <button
        type="button"
        onClick={onRemove}
        className="text-xs font-semibold text-foreground/50 transition hover:text-foreground"
      >
        Eliminar
      </button>
    </div>
    <label className="space-y-1 text-sm text-foreground/70">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/50">Slug</span>
      <input
        className="w-full rounded-xl border border-foreground/10 bg-background px-3 py-2 text-sm"
        value={service.slug}
        onChange={(event) => onChange({ ...service, slug: event.target.value })}
      />
    </label>
    <RichLocaleInputs label="Título" value={service.title} onChange={(value) => onChange({ ...service, title: value })} />
    <RichLocaleInputs
      label="Descripción breve"
      value={service.summary}
      onChange={(value) => onChange({ ...service, summary: value })}
    />
    <LocaleListEditor
      label="Entregables"
      addLabel="Agregar entregable"
      values={service.outcomes}
      onChange={(values) => onChange({ ...service, outcomes: values })}
    />
    <div className="space-y-2 rounded-2xl border border-foreground/10 bg-foreground/5 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/50">Galería del servicio</p>
        <button
          type="button"
          onClick={() =>
            onChange({
              ...service,
              gallery: [...service.gallery, createSiteGalleryImageField(randomId())],
            })
          }
          className="rounded-full border border-foreground/10 px-3 py-1 text-xs font-semibold text-foreground/70 hover:border-foreground/30"
        >
          Agregar imagen
        </button>
      </div>

      {service.gallery.map((image) => (
        <div key={image.id} className="space-y-2 rounded-xl border border-foreground/10 bg-background/60 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-foreground/50">Imagen</p>
            <button
              type="button"
              onClick={() => onChange({ ...service, gallery: service.gallery.filter((item) => item.id !== image.id) })}
              className="text-xs font-semibold text-foreground/50 hover:text-foreground"
            >
              Eliminar
            </button>
          </div>
          <input
            className="w-full rounded-xl border border-foreground/10 bg-background px-3 py-2 text-sm"
            placeholder="https://..."
            value={image.src}
            onChange={(event) =>
              onChange({
                ...service,
                gallery: service.gallery.map((item) =>
                  item.id === image.id ? { ...item, src: event.target.value } : item,
                ),
              })
            }
          />
          <RichLocaleInputs
            label="Alt imagen"
            value={image.alt}
            onChange={(value) =>
              onChange({
                ...service,
                gallery: service.gallery.map((item) =>
                  item.id === image.id ? { ...item, alt: value } : item,
                ),
              })
            }
          />
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-foreground/10 px-3 py-1.5 text-xs font-semibold text-foreground/70 hover:border-foreground/30">
              {uploadingGalleryId === image.id ? "Cargando..." : "Subir"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingGalleryId === image.id}
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;

                  setUploadingGalleryId(image.id);
                  try {
                    const upload = await uploadToCloudinary(file, `services/${service.slug || "library"}`);
                    onChange({
                      ...service,
                      gallery: service.gallery.map((item) =>
                        item.id === image.id ? { ...item, src: upload.src } : item,
                      ),
                    });
                  } finally {
                    setUploadingGalleryId(null);
                    event.currentTarget.value = "";
                  }
                }}
              />
            </label>
            {cloudinaryReady && openCloudinaryPicker && (
              <button
                type="button"
                onClick={() =>
                  openCloudinaryPicker({
                    onSelect: (asset) => {
                      onChange({
                        ...service,
                        gallery: service.gallery.map((item) =>
                          item.id === image.id ? { ...item, src: asset.url } : item,
                        ),
                      });
                    },
                  })
                }
                className="rounded-full border border-foreground/10 px-3 py-1.5 text-xs font-semibold text-foreground/70 hover:border-foreground/30"
              >
                Elegir de biblioteca
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
  );
};

const SiteContentManager = ({
  siteContent,
  cloudinaryReady,
  openCloudinaryPicker,
  visibleSections,
  initialSection,
  heading = "Textos del sitio",
  description = "Edita únicamente los textos y ajustes que utiliza el sitio público.",
}: {
  siteContent: SiteContent;
  cloudinaryReady: boolean;
  openCloudinaryPicker?: (options: CloudinaryPickerOptions) => void;
  visibleSections?: SiteContentSection[];
  initialSection?: SiteContentSection;
  heading?: string;
  description?: string;
}) => {
  const router = useRouter();
  const [draft, setDraft] = useState<SiteContentField>(() => createSiteContentField(siteContent));
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SiteContentSection>(
    initialSection ?? visibleSections?.[0] ?? "home",
  );
  const [heroVideoUploadStatus, setHeroVideoUploadStatus] = useState<"idle" | "uploading">("idle");
  const [heroPosterUploadStatus, setHeroPosterUploadStatus] = useState<"idle" | "uploading">("idle");

  useEffect(() => {
    setDraft(createSiteContentField(siteContent));
  }, [siteContent]);

  const handleSave = useCallback(async () => {
    setStatus("saving");
    setMessage(null);

    try {
      const payload = buildSitePayload(draft);
      const response = await fetch("/api/site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(extractApiErrorMessage(data, "No se pudo guardar el contenido"));
      }

      setMessage("Contenido guardado en MongoDB.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar el contenido");
    } finally {
      setStatus("idle");
    }
  }, [draft, router]);

  const handleHeroVideoFile = useCallback(
    async (file?: File) => {
      if (!file) return;

      setHeroVideoUploadStatus("uploading");
      setMessage(null);

      try {
        const result = await uploadToCloudinary(file, "site/hero/video");
        setDraft((previous) => ({
          ...previous,
          home: {
            ...previous.home,
            heroVideo: {
              ...previous.home.heroVideo,
              url: result.src,
              publicId: result.publicId,
            },
          },
        }));
        setMessage("Video subido a Cloudinary. Se usará como fondo en el hero.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "No se pudo subir el video");
      } finally {
        setHeroVideoUploadStatus("idle");
      }
    },
    [],
  );

  const handleHeroPosterFile = useCallback(
    async (file?: File) => {
      if (!file) return;

      setHeroPosterUploadStatus("uploading");
      setMessage(null);

      try {
        const result = await uploadToCloudinary(file, "site/hero/poster");
        setDraft((previous) => ({
          ...previous,
          home: {
            ...previous.home,
            heroVideo: { ...previous.home.heroVideo, poster: result.src },
          },
        }));
        setMessage("Poster subido a Cloudinary y listo para el video de fondo.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "No se pudo subir el poster");
      } finally {
        setHeroPosterUploadStatus("idle");
      }
    },
    [],
  );

  const allSiteSections: { key: SiteContentSection; label: string; description: string }[] = [
    {
      key: "navigation",
      label: "Navegación",
      description: "Nombre del sitio, menú y etiquetas del header.",
    },
    {
      key: "home",
      label: "Home",
      description: "Hero, video de fondo y CTAs principales.",
    },
    {
      key: "servicesPage",
      label: "Servicios",
      description: "Copy de la página y chips destacados.",
    },
    {
      key: "projectsPage",
      label: "Proyectos",
      description: "Título y textos auxiliares del archivo de proyectos.",
    },
    {
      key: "bioPage",
      label: "Bio",
      description: "Etiquetas y mensajes auxiliares de la biografía.",
    },
    {
      key: "eventsPage",
      label: "Eventos",
      description: "Introducción, agenda, archivo y estados vacíos.",
    },
    {
      key: "publicationsPage",
      label: "Publicaciones",
      description: "Introducción y acciones del índice bibliográfico.",
    },
    {
      key: "clientsPage",
      label: "Clientes",
      description: "Título, copy e imagen de la página de clientes.",
    },
    {
      key: "contact",
      label: "Contacto",
      description: "Texto, correo y lista de preparación.",
    },
    {
      key: "footer",
      label: "Footer",
      description: "Copy inferior, Instagram y enlace de administración.",
    },
    {
      key: "servicesList",
      label: "Lista de servicios",
      description: "Ofertas publicadas y entregables.",
    },
  ];
  const siteSections = allSiteSections.filter(
    (section) => !visibleSections || visibleSections.includes(section.key),
  );

  return (
    <section className="space-y-6 rounded-4xl border border-foreground/10 bg-foreground/5 p-6 shadow-sm">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/50">Sitio</p>
          <h2 className="text-xl font-semibold text-foreground">{heading}</h2>
          <p className="text-sm text-foreground/70">{description}</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={status === "saving"}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-sm transition hover:-translate-y-0.5 hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "saving" ? "Guardando..." : "Guardar cambios"}
        </button>
      </header>

      {message && (
        <p className="rounded-2xl border border-foreground/10 bg-background px-4 py-3 text-sm text-foreground/80">{message}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {siteSections.map((section) => (
          <button
            key={section.key}
            type="button"
            onClick={() => setActiveSection(section.key)}
            className={`flex flex-col items-start rounded-3xl border p-4 text-left transition ${
              activeSection === section.key
                ? "border-foreground/40 bg-background shadow-sm"
                : "border-foreground/10 bg-background/60 hover:border-foreground/20"
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">{section.label}</span>
            <p className="pt-1 text-sm text-foreground/80">{section.description}</p>
          </button>
        ))}
      </div>

      {activeSection === "home" && (
        <div className="space-y-4 rounded-3xl border border-foreground/10 bg-background p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground/60">Home</h3>
          <p className="text-sm leading-6 text-foreground/60">
            Estos son únicamente los campos que utiliza el Home actual. La selección de obras y sus
            nombres para el tablero interactivo se gestiona dentro de cada proyecto.
          </p>
          <RichLocaleInputs
            label="Titular principal"
            value={draft.home.heroHeadline}
            onChange={(value) => setDraft({ ...draft, home: { ...draft.home, heroHeadline: value } })}
          />
          <RichLocaleInputs
            label="Subtítulo"
            value={draft.home.heroSubtitle}
            onChange={(value) => setDraft({ ...draft, home: { ...draft.home, heroSubtitle: value } })}
            placeholder="Redacta con estilos: negritas, itálicas, color y tamaños."
          />
          <RichLocaleInputs
            label="CTA primaria"
            value={draft.home.heroPrimaryCta}
            onChange={(value) => setDraft({ ...draft, home: { ...draft.home, heroPrimaryCta: value } })}
          />
          <RichLocaleInputs
            label="CTA secundaria"
            value={draft.home.heroSecondaryCta}
            onChange={(value) => setDraft({ ...draft, home: { ...draft.home, heroSecondaryCta: value } })}
          />
          <div className="space-y-2 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-3 text-sm text-foreground/70">
            <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.14em] text-foreground/60">
              <span>Video de fondo (opcional)</span>
              <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[11px] font-semibold text-foreground/70">Hero</span>
            </div>
            <p className="text-xs text-foreground/60">
              Sube un video a Cloudinary o pega cualquier URL segura (mp4/webm). El video se reproducirá en loop detrás de las tarjetas
              de Discovery/Delivery/Growth.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">URL del video</span>
                <input
                  className="w-full rounded-xl border border-foreground/10 bg-background px-3 py-2 text-sm"
                  placeholder="https://.../video.mp4"
                  value={draft.home.heroVideo.url}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      home: { ...draft.home, heroVideo: { ...draft.home.heroVideo, url: event.target.value } },
                    })
                  }
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">Public ID (Cloudinary)</span>
                <input
                  className="w-full rounded-xl border border-foreground/10 bg-background px-3 py-2 text-sm"
                  placeholder="carpeta/video-id"
                  value={draft.home.heroVideo.publicId}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      home: { ...draft.home, heroVideo: { ...draft.home.heroVideo, publicId: event.target.value } },
                    })
                  }
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">Poster (opcional)</span>
                <input
                  className="w-full rounded-xl border border-foreground/10 bg-background px-3 py-2 text-sm"
                  placeholder="https://.../frame.jpg"
                  value={draft.home.heroVideo.poster}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      home: { ...draft.home, heroVideo: { ...draft.home.heroVideo, poster: event.target.value } },
                    })
                  }
                />
              </label>
              <div className="flex flex-wrap gap-2 pt-1 text-xs text-foreground/60">
                <label className="inline-flex items-center gap-2 rounded-full border border-foreground/10 px-3 py-1 font-semibold text-foreground/80 hover:border-foreground/30">
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(event) => {
                      const [file] = Array.from(event.target.files ?? []);
                      void handleHeroVideoFile(file);
                      event.target.value = "";
                    }}
                  />
                  {heroVideoUploadStatus === "uploading" ? "Subiendo video..." : "Subir video"}
                </label>
                <label className="inline-flex items-center gap-2 rounded-full border border-foreground/10 px-3 py-1 font-semibold text-foreground/80 hover:border-foreground/30">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const [file] = Array.from(event.target.files ?? []);
                      void handleHeroPosterFile(file);
                      event.target.value = "";
                    }}
                  />
                  {heroPosterUploadStatus === "uploading" ? "Subiendo poster..." : "Subir poster"}
                </label>
              </div>
            </div>
          </div>
          <RichLocaleInputs
            label="Etiqueta sección servicios"
            value={draft.home.servicesBadgeLabel}
            onChange={(value) => setDraft({ ...draft, home: { ...draft.home, servicesBadgeLabel: value } })}
          />
          <RichLocaleInputs
            label="CTA tarjetas de servicio"
            value={draft.home.servicesCardCta}
            onChange={(value) => setDraft({ ...draft, home: { ...draft.home, servicesCardCta: value } })}
          />
          <RichLocaleInputs
            label="Etiqueta sección proyectos"
            value={draft.home.projectsBadgeLabel}
            onChange={(value) => setDraft({ ...draft, home: { ...draft.home, projectsBadgeLabel: value } })}
          />
          <RichLocaleInputs
            label="CTA tarjetas de proyecto"
            value={draft.home.projectsCardCta}
            onChange={(value) => setDraft({ ...draft, home: { ...draft.home, projectsCardCta: value } })}
          />
          <RichLocaleInputs
            label="Título de clientes"
            value={draft.home.clientsTitle}
            onChange={(value) => setDraft({ ...draft, home: { ...draft.home, clientsTitle: value } })}
          />
          <RichLocaleInputs
            label="CTA de contacto"
            value={draft.home.contactCta}
            onChange={(value) => setDraft({ ...draft, home: { ...draft.home, contactCta: value } })}
          />
          <RichLocaleInputs
            label="Texto de enlace a sitios de clientes"
            value={draft.home.clientsWebsiteLabel}
            onChange={(value) => setDraft({ ...draft, home: { ...draft.home, clientsWebsiteLabel: value } })}
          />
        </div>
      )}

      {activeSection === "navigation" && (
        <div className="space-y-4 rounded-3xl border border-foreground/10 bg-background p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground/60">Navegación</h3>
          <p className="text-sm leading-6 text-foreground/60">
            El nombre visible del sitio se edita en Bio. Aquí puedes cambiar las etiquetas del menú.
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            <PlainLocaleInputs
              label="Etiqueta Inicio"
              value={draft.navigation.homeLabel}
              onChange={(value) => setDraft({ ...draft, navigation: { ...draft.navigation, homeLabel: value } })}
            />
            <PlainLocaleInputs
              label="Etiqueta Bio"
              value={draft.navigation.bioLabel}
              onChange={(value) => setDraft({ ...draft, navigation: { ...draft.navigation, bioLabel: value } })}
            />
            <PlainLocaleInputs
              label="Etiqueta Proyectos"
              value={draft.navigation.projectsLabel}
              onChange={(value) => setDraft({ ...draft, navigation: { ...draft.navigation, projectsLabel: value } })}
            />
            <PlainLocaleInputs
              label="Etiqueta Eventos"
              value={draft.navigation.eventsLabel}
              onChange={(value) => setDraft({ ...draft, navigation: { ...draft.navigation, eventsLabel: value } })}
            />
            <PlainLocaleInputs
              label="Etiqueta Publicaciones"
              value={draft.navigation.publicationsLabel}
              onChange={(value) => setDraft({ ...draft, navigation: { ...draft.navigation, publicationsLabel: value } })}
            />
            <PlainLocaleInputs
              label="Etiqueta Contacto"
              value={draft.navigation.contactLabel}
              onChange={(value) => setDraft({ ...draft, navigation: { ...draft.navigation, contactLabel: value } })}
            />
            <PlainLocaleInputs
              label="Label abrir menú"
              value={draft.navigation.openMenuLabel}
              onChange={(value) => setDraft({ ...draft, navigation: { ...draft.navigation, openMenuLabel: value } })}
            />
            <PlainLocaleInputs
              label="Label cerrar menú"
              value={draft.navigation.closeMenuLabel}
              onChange={(value) => setDraft({ ...draft, navigation: { ...draft.navigation, closeMenuLabel: value } })}
            />
          </div>
        </div>
      )}

      {activeSection === "servicesPage" && (
        <div className="space-y-4 rounded-3xl border border-foreground/10 bg-background p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground/60">Servicios</h3>
          <RichLocaleInputs
            label="Título página servicios"
            value={draft.servicesPage.title}
            onChange={(value) => setDraft({ ...draft, servicesPage: { ...draft.servicesPage, title: value } })}
          />
          <RichLocaleInputs
            label="Copy principal servicios"
            value={draft.servicesPage.copy}
            onChange={(value) => setDraft({ ...draft, servicesPage: { ...draft.servicesPage, copy: value } })}
          />
          <RichLocaleInputs
            label="CTA servicios"
            value={draft.servicesPage.ctaLabel}
            onChange={(value) => setDraft({ ...draft, servicesPage: { ...draft.servicesPage, ctaLabel: value } })}
          />
          <LocaleListEditor
            label="Chips de servicios"
            values={draft.servicesPage.chips}
            onChange={(values) => setDraft({ ...draft, servicesPage: { ...draft.servicesPage, chips: values } })}
          />
          <RichLocaleInputs
            label="Etiqueta mapa rápido"
            value={draft.servicesPage.quickMapLabel}
            onChange={(value) => setDraft({ ...draft, servicesPage: { ...draft.servicesPage, quickMapLabel: value } })}
          />
          <RichLocaleInputs
            label="Etiqueta highlight 1"
            value={draft.servicesPage.highlightPrimaryLabel}
            onChange={(value) =>
              setDraft({ ...draft, servicesPage: { ...draft.servicesPage, highlightPrimaryLabel: value } })
            }
          />
          <RichLocaleInputs
            label="Etiqueta highlight 2"
            value={draft.servicesPage.highlightSecondaryLabel}
            onChange={(value) =>
              setDraft({ ...draft, servicesPage: { ...draft.servicesPage, highlightSecondaryLabel: value } })
            }
          />
          <RichLocaleInputs
            label="Título sesión inicial"
            value={draft.servicesPage.sessionTitle}
            onChange={(value) => setDraft({ ...draft, servicesPage: { ...draft.servicesPage, sessionTitle: value } })}
          />
          <RichLocaleInputs
            label="Copy sesión inicial"
            value={draft.servicesPage.sessionCopy}
            onChange={(value) => setDraft({ ...draft, servicesPage: { ...draft.servicesPage, sessionCopy: value } })}
          />
          <RichLocaleInputs
            label="CTA hablar con el equipo"
            value={draft.servicesPage.talkCtaLabel}
            onChange={(value) => setDraft({ ...draft, servicesPage: { ...draft.servicesPage, talkCtaLabel: value } })}
          />
          <RichLocaleInputs
            label="Título de entregables"
            value={draft.servicesPage.outcomesLabel}
            onChange={(value) => setDraft({ ...draft, servicesPage: { ...draft.servicesPage, outcomesLabel: value } })}
          />
          <label className="space-y-1 text-sm text-foreground/70">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/50">URL imagen servicios</span>
            <input
              className="w-full rounded-xl border border-foreground/10 bg-background px-3 py-2 text-sm"
              placeholder="/images/services-visual.svg"
              value={draft.servicesPage.imageSrc}
              onChange={(event) =>
                setDraft({ ...draft, servicesPage: { ...draft.servicesPage, imageSrc: event.target.value } })
              }
            />
          </label>
          <RichLocaleInputs
            label="Alt imagen servicios"
            value={draft.servicesPage.imageAlt}
            onChange={(value) => setDraft({ ...draft, servicesPage: { ...draft.servicesPage, imageAlt: value } })}
          />
          <div className="space-y-3 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
              Galerías por servicio (las que se muestran en el contenedor principal)
            </p>
            <div className="space-y-3">
              {draft.services.map((service, serviceIndex) => (
                <div key={service.id} className="space-y-3 rounded-xl border border-foreground/10 bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground/80">
                      Servicio {serviceIndex + 1}: {service.title.es || service.title.en || service.slug || "Sin título"}
                    </p>
                    <button
                      type="button"
                      className="rounded-full border border-foreground/20 px-3 py-1 text-xs font-semibold text-foreground/70 hover:border-foreground/40"
                      onClick={() => {
                        const nextServices = [...draft.services];
                        nextServices[serviceIndex] = {
                          ...service,
                          gallery: [...service.gallery, createSiteGalleryImageField(randomId())],
                        };
                        setDraft({ ...draft, services: nextServices });
                      }}
                    >
                      Añadir imagen
                    </button>
                  </div>

                  {service.gallery.length === 0 && (
                    <p className="text-xs text-foreground/60">
                      Este servicio no tiene imágenes. Se usará la galería fallback global o la URL de imagen servicios.
                    </p>
                  )}

                  <div className="space-y-2">
                    {service.gallery.map((image) => (
                      <div key={image.id} className="space-y-2 rounded-xl border border-foreground/10 bg-foreground/5 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/50">Imagen</p>
                          <button
                            type="button"
                            className="text-xs font-semibold text-red-500 hover:text-red-400"
                            onClick={() => {
                              const nextServices = [...draft.services];
                              nextServices[serviceIndex] = {
                                ...service,
                                gallery: service.gallery.filter((item) => item.id !== image.id),
                              };
                              setDraft({ ...draft, services: nextServices });
                            }}
                          >
                            Eliminar
                          </button>
                        </div>
                        <label className="space-y-1 text-sm text-foreground/70">
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/50">URL imagen</span>
                          <input
                            className="w-full rounded-xl border border-foreground/10 bg-background px-3 py-2 text-sm"
                            placeholder="https://..."
                            value={image.src}
                            onChange={(event) => {
                              const nextServices = [...draft.services];
                              nextServices[serviceIndex] = {
                                ...service,
                                gallery: service.gallery.map((item) =>
                                  item.id === image.id ? { ...item, src: event.target.value } : item,
                                ),
                              };
                              setDraft({ ...draft, services: nextServices });
                            }}
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <RichLocaleInputs
            label="CTA volver arriba"
            value={draft.servicesPage.backToTopLabel}
            onChange={(value) => setDraft({ ...draft, servicesPage: { ...draft.servicesPage, backToTopLabel: value } })}
          />
        </div>
      )}

      {activeSection === "projectsPage" && (
        <div className="space-y-4 rounded-3xl border border-foreground/10 bg-background p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground/60">Proyectos</h3>
          <PlainLocaleInputs
            label="Título página proyectos"
            value={draft.projectsPage.title}
            onChange={(value) => setDraft({ ...draft, projectsPage: { ...draft.projectsPage, title: value } })}
          />
          <p className="text-sm leading-6 text-foreground/60">
            La selección, los nombres y el orden del desplegable se editan directamente en cada proyecto.
          </p>
        </div>
      )}

      {activeSection === "bioPage" && (
        <div className="space-y-4 rounded-3xl border border-foreground/10 bg-background p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground/60">Bio · textos de interfaz</h3>
          <PlainLocaleInputs
            label="Título de la sección"
            value={draft.bioPage.title}
            onChange={(value) => setDraft({ ...draft, bioPage: { ...draft.bioPage, title: value } })}
          />
          <PlainLocaleInputs
            label="Mensaje cuando aún no hay biografía"
            value={draft.bioPage.pending}
            onChange={(value) => setDraft({ ...draft, bioPage: { ...draft.bioPage, pending: value } })}
            multiline
          />
          <PlainLocaleInputs
            label="Etiqueta para descargar el CV"
            value={draft.bioPage.cvLabel}
            onChange={(value) => setDraft({ ...draft, bioPage: { ...draft.bioPage, cvLabel: value } })}
          />
        </div>
      )}

      {activeSection === "eventsPage" && (
        <div className="space-y-4 rounded-3xl border border-foreground/10 bg-background p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground/60">Eventos · textos de interfaz</h3>
          <PlainLocaleInputs
            label="Título"
            value={draft.eventsPage.title}
            onChange={(value) => setDraft({ ...draft, eventsPage: { ...draft.eventsPage, title: value } })}
          />
          <PlainLocaleInputs
            label="Introducción"
            value={draft.eventsPage.introduction}
            onChange={(value) => setDraft({ ...draft, eventsPage: { ...draft.eventsPage, introduction: value } })}
            multiline
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <PlainLocaleInputs
              label="Título de próximos"
              value={draft.eventsPage.upcomingTitle}
              onChange={(value) => setDraft({ ...draft, eventsPage: { ...draft.eventsPage, upcomingTitle: value } })}
            />
            <PlainLocaleInputs
              label="Título del archivo"
              value={draft.eventsPage.pastTitle}
              onChange={(value) => setDraft({ ...draft, eventsPage: { ...draft.eventsPage, pastTitle: value } })}
            />
            <PlainLocaleInputs
              label="Mensaje sin próximos eventos"
              value={draft.eventsPage.emptyUpcoming}
              onChange={(value) => setDraft({ ...draft, eventsPage: { ...draft.eventsPage, emptyUpcoming: value } })}
            />
            <PlainLocaleInputs
              label="Mensaje sin archivo"
              value={draft.eventsPage.emptyPast}
              onChange={(value) => setDraft({ ...draft, eventsPage: { ...draft.eventsPage, emptyPast: value } })}
            />
            <PlainLocaleInputs
              label="Etiqueta de más información"
              value={draft.eventsPage.detailsLabel}
              onChange={(value) => setDraft({ ...draft, eventsPage: { ...draft.eventsPage, detailsLabel: value } })}
            />
          </div>
        </div>
      )}

      {activeSection === "publicationsPage" && (
        <div className="space-y-4 rounded-3xl border border-foreground/10 bg-background p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground/60">Publicaciones · textos de interfaz</h3>
          <PlainLocaleInputs
            label="Título"
            value={draft.publicationsPage.title}
            onChange={(value) => setDraft({ ...draft, publicationsPage: { ...draft.publicationsPage, title: value } })}
          />
          <PlainLocaleInputs
            label="Introducción"
            value={draft.publicationsPage.introduction}
            onChange={(value) => setDraft({ ...draft, publicationsPage: { ...draft.publicationsPage, introduction: value } })}
            multiline
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <PlainLocaleInputs
              label="Mensaje sin publicaciones"
              value={draft.publicationsPage.empty}
              onChange={(value) => setDraft({ ...draft, publicationsPage: { ...draft.publicationsPage, empty: value } })}
            />
            <PlainLocaleInputs
              label="Etiqueta abrir publicación"
              value={draft.publicationsPage.openLabel}
              onChange={(value) => setDraft({ ...draft, publicationsPage: { ...draft.publicationsPage, openLabel: value } })}
            />
            <PlainLocaleInputs
              label="Etiqueta descargar"
              value={draft.publicationsPage.downloadLabel}
              onChange={(value) => setDraft({ ...draft, publicationsPage: { ...draft.publicationsPage, downloadLabel: value } })}
            />
          </div>
        </div>
      )}

      {activeSection === "clientsPage" && (
        <div className="space-y-4 rounded-3xl border border-foreground/10 bg-background p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground/60">Clientes</h3>
          <RichLocaleInputs
            label="Título"
            value={draft.clientsPage.title}
            onChange={(value) => setDraft({ ...draft, clientsPage: { ...draft.clientsPage, title: value } })}
          />
          <RichLocaleInputs
            label="Descripción"
            value={draft.clientsPage.copy}
            onChange={(value) => setDraft({ ...draft, clientsPage: { ...draft.clientsPage, copy: value } })}
          />
          <label className="space-y-1 text-sm text-foreground/70">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/50">URL imagen</span>
            <input
              className="w-full rounded-xl border border-foreground/10 bg-background px-3 py-2 text-sm"
              placeholder="/images/clients-visual.svg"
              value={draft.clientsPage.imageSrc}
              onChange={(event) =>
                setDraft({ ...draft, clientsPage: { ...draft.clientsPage, imageSrc: event.target.value } })
              }
            />
          </label>
          <RichLocaleInputs
            label="Alt imagen"
            value={draft.clientsPage.imageAlt}
            onChange={(value) => setDraft({ ...draft, clientsPage: { ...draft.clientsPage, imageAlt: value } })}
          />
          <RichLocaleInputs
            label="Texto enlace sitio"
            value={draft.clientsPage.websiteLabel}
            onChange={(value) => setDraft({ ...draft, clientsPage: { ...draft.clientsPage, websiteLabel: value } })}
          />
        </div>
      )}

      {activeSection === "contact" && (
        <div className="space-y-4 rounded-3xl border border-foreground/10 bg-background p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground/60">Contacto</h3>
          <RichLocaleInputs
            label="Título contacto"
            value={draft.contact.title}
            onChange={(value) => setDraft({ ...draft, contact: { ...draft.contact, title: value } })}
          />
          <RichLocaleInputs
            label="Copy contacto"
            value={draft.contact.copy}
            onChange={(value) => setDraft({ ...draft, contact: { ...draft.contact, copy: value } })}
          />
          <label className="space-y-1 text-sm text-foreground/70">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/50">Correo</span>
            <input
              className="w-full rounded-xl border border-foreground/10 bg-background px-3 py-2 text-sm"
              value={draft.contact.email}
              onChange={(event) => setDraft({ ...draft, contact: { ...draft.contact, email: event.target.value } })}
            />
          </label>
          <RichLocaleInputs
            label="Título formulario"
            value={draft.contact.formTitle}
            onChange={(value) => setDraft({ ...draft, contact: { ...draft.contact, formTitle: value } })}
          />
          <RichLocaleInputs
            label="Introducción del formulario"
            value={draft.contact.formSubtitle}
            onChange={(value) => setDraft({ ...draft, contact: { ...draft.contact, formSubtitle: value } })}
          />
          <RichLocaleInputs
            label="Etiqueta éxito"
            value={draft.contact.successLabel}
            onChange={(value) => setDraft({ ...draft, contact: { ...draft.contact, successLabel: value } })}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <RichLocaleInputs
              label="Etiqueta nombre"
              value={draft.contact.nameLabel}
              onChange={(value) => setDraft({ ...draft, contact: { ...draft.contact, nameLabel: value } })}
            />
            <RichLocaleInputs
              label="Etiqueta correo"
              value={draft.contact.emailLabel}
              onChange={(value) => setDraft({ ...draft, contact: { ...draft.contact, emailLabel: value } })}
            />
            <RichLocaleInputs
              label="Etiqueta organización"
              value={draft.contact.organizationLabel}
              onChange={(value) => setDraft({ ...draft, contact: { ...draft.contact, organizationLabel: value } })}
            />
            <RichLocaleInputs
              label="Etiqueta teléfono"
              value={draft.contact.phoneLabel}
              onChange={(value) => setDraft({ ...draft, contact: { ...draft.contact, phoneLabel: value } })}
            />
            <RichLocaleInputs
              label="Etiqueta asunto"
              value={draft.contact.subjectLabel}
              onChange={(value) => setDraft({ ...draft, contact: { ...draft.contact, subjectLabel: value } })}
            />
            <RichLocaleInputs
              label="Etiqueta mensaje"
              value={draft.contact.messageLabel}
              onChange={(value) => setDraft({ ...draft, contact: { ...draft.contact, messageLabel: value } })}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <RichLocaleInputs
              label="CTA enviar"
              value={draft.contact.submitLabel}
              onChange={(value) => setDraft({ ...draft, contact: { ...draft.contact, submitLabel: value } })}
            />
            <RichLocaleInputs
              label="CTA enviando"
              value={draft.contact.sendingLabel}
              onChange={(value) => setDraft({ ...draft, contact: { ...draft.contact, sendingLabel: value } })}
            />
          </div>
        </div>
      )}

      {activeSection === "footer" && (
        <div className="space-y-4 rounded-3xl border border-foreground/10 bg-background p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground/60">Footer</h3>
          <PlainLocaleInputs
            label="Copy footer"
            value={draft.footer.tagline}
            onChange={(value) => setDraft({ ...draft, footer: { ...draft.footer, tagline: value } })}
          />
          <PlainLocaleInputs
            label="Etiqueta Instagram"
            value={draft.footer.instagramLabel}
            onChange={(value) => setDraft({ ...draft, footer: { ...draft.footer, instagramLabel: value } })}
          />
          <label className="space-y-1 text-sm text-foreground/70">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/50">URL Instagram</span>
            <input
              className="w-full rounded-xl border border-foreground/10 bg-background px-3 py-2 text-sm"
              placeholder="https://www.instagram.com/..."
              value={draft.footer.instagramUrl}
              onChange={(event) =>
                setDraft({ ...draft, footer: { ...draft.footer, instagramUrl: event.target.value } })
              }
            />
          </label>
          <PlainLocaleInputs
            label="Etiqueta Facebook"
            value={draft.footer.facebookLabel}
            onChange={(value) => setDraft({ ...draft, footer: { ...draft.footer, facebookLabel: value } })}
          />
          <label className="space-y-1 text-sm text-foreground/70">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/50">URL Facebook</span>
            <input
              className="w-full rounded-xl border border-foreground/10 bg-background px-3 py-2 text-sm"
              placeholder="https://www.facebook.com/..."
              value={draft.footer.facebookUrl}
              onChange={(event) =>
                setDraft({ ...draft, footer: { ...draft.footer, facebookUrl: event.target.value } })
              }
            />
          </label>
          <PlainLocaleInputs
            label="Etiqueta LinkedIn"
            value={draft.footer.linkedinLabel}
            onChange={(value) => setDraft({ ...draft, footer: { ...draft.footer, linkedinLabel: value } })}
          />
          <label className="space-y-1 text-sm text-foreground/70">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/50">URL LinkedIn</span>
            <input
              className="w-full rounded-xl border border-foreground/10 bg-background px-3 py-2 text-sm"
              placeholder="https://www.linkedin.com/company/..."
              value={draft.footer.linkedinUrl}
              onChange={(event) =>
                setDraft({ ...draft, footer: { ...draft.footer, linkedinUrl: event.target.value } })
              }
            />
          </label>
          <PlainLocaleInputs
            label="Etiqueta admin"
            value={draft.footer.adminLabel}
            onChange={(value) => setDraft({ ...draft, footer: { ...draft.footer, adminLabel: value } })}
          />
        </div>
      )}

      {activeSection === "servicesList" && (
        <div className="space-y-3 rounded-3xl border border-foreground/10 bg-background/60 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground/60">Servicios publicados</h3>
            <button
              type="button"
              onClick={() =>
                setDraft({
                  ...draft,
                  services: [...draft.services, createServiceField(`service-${draft.services.length}`)],
                })
              }
              className="inline-flex items-center gap-2 rounded-full border border-foreground/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/70 hover:border-foreground/30"
            >
              Agregar servicio
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {draft.services.map((service, index) => (
              <ServiceEditor
                key={service.id}
                service={service}
                cloudinaryReady={cloudinaryReady}
                openCloudinaryPicker={openCloudinaryPicker}
                onRemove={() =>
                  setDraft({
                    ...draft,
                    services: draft.services.filter((_, serviceIndex) => serviceIndex !== index),
                  })
                }
                onChange={(value) => {
                  const next = [...draft.services];
                  next[index] = value;
                  setDraft({ ...draft, services: next });
                }}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

const ClientManager = ({
  clients,
  cloudinaryReady,
  openCloudinaryPicker,
}: {
  clients: Client[];
  cloudinaryReady: boolean;
  openCloudinaryPicker?: (options: CloudinaryPickerOptions) => void;
}) => {
  const router = useRouter();
  const [selectedSlug, setSelectedSlug] = useState<string>("new");
  const [status, setStatus] = useState<"idle" | "saving" | "deleting">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const emptyForm = useMemo(
    () => ({
      slug: "",
      name: "",
      kind: "client" as ClientKind,
      sector: { es: "", en: "" },
      summary: { es: "", en: "" },
      website: "",
      order: "",
      isPrivate: false,
      image: createImageField(randomId()),
    }),
    [],
  );

  const [form, setForm] = useState({ ...emptyForm });

  useEffect(() => {
    if (selectedSlug === "new") {
      setForm({ ...emptyForm, image: createImageField(randomId()) });
      return;
    }

    const client = clients.find((item) => item.slug === selectedSlug);

    if (client) {
      setForm({
        slug: client.slug,
        name: client.name,
        kind: client.kind,
        sector: createLocaleField(client.sector),
        summary: createLocaleField(client.summary),
        website: client.website ?? "",
        order: client.order !== undefined ? String(client.order) : "",
        isPrivate: Boolean(client.isPrivate),
        image: createImageField(randomId(), client.image),
      });
    }
  }, [selectedSlug, clients, emptyForm]);

  const handleSubmit = async () => {
    setStatus("saving");
    setMessage(null);

    try {
      if (!form.slug.trim() || !form.name.trim()) {
        throw new Error("El slug y el nombre son obligatorios");
      }

      const payload: Record<string, unknown> = {
        slug: form.slug.trim(),
        name: form.name.trim(),
        kind: form.kind,
        sector: trimLocaleField(form.sector),
        summary: trimLocaleField(form.summary),
        isPrivate: form.isPrivate,
      };

      if (form.website.trim()) {
        payload.website = form.website.trim();
      }

      if (form.order.trim()) {
        const orderNumber = Number.parseInt(form.order.trim(), 10);
        if (!Number.isNaN(orderNumber)) {
          payload.order = orderNumber;
        }
      }

      if (imageHasData(form.image)) {
        const footnote = normalizeOptionalLocaleField(form.image.footnote);

        payload.image = {
          src: form.image.src.trim() || undefined,
          publicId: form.image.publicId.trim() || undefined,
          alt: trimLocaleField(form.image.alt),
          footnote,
        };
      }

      const endpoint = selectedSlug === "new" ? "/api/clients" : `/api/clients/${selectedSlug}`;
      const method = selectedSlug === "new" ? "POST" : "PATCH";

      const response = await fetch(endpoint, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(extractApiErrorMessage(data, "No fue posible guardar el cliente"));
      }

      setMessage("Cliente guardado correctamente");
      setStatus("idle");
      router.refresh();
    } catch (error) {
      console.error(error);
      setStatus("idle");
      setMessage(error instanceof Error ? error.message : "Ocurrió un error al guardar");
    }
  };

  const handleDelete = async () => {
    if (selectedSlug === "new") {
      setForm({ ...emptyForm, image: createImageField(randomId()) });
      return;
    }

    const clientName = clients.find((client) => client.slug === selectedSlug)?.name || selectedSlug;

    if (!window.confirm(`¿Eliminar definitivamente “${clientName}”?`)) {
      return;
    }

    setStatus("deleting");
    setMessage(null);

    try {
      const response = await fetch(`/api/clients/${selectedSlug}` as const, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(extractApiErrorMessage(data, "No fue posible eliminar el cliente"));
      }

      setMessage("Cliente eliminado");
      setStatus("idle");
      setSelectedSlug("new");
      router.refresh();
    } catch (error) {
      console.error(error);
      setStatus("idle");
      setMessage(error instanceof Error ? error.message : "Ocurrió un error al eliminar");
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground/90">Personas, instituciones y colaboradores</h2>
        <p className="text-sm text-foreground/60">
          Gestiona los perfiles de clientes, instituciones y aliados que aparecen en el sitio.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,220px)_1fr]">
        <aside className="space-y-2 rounded-2xl border border-foreground/10 bg-foreground/5 p-4">
          <button
            type="button"
            onClick={() => setSelectedSlug("new")}
            className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
              selectedSlug === "new"
                ? "bg-foreground text-background"
                : "text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
            }`}
          >
            + Nuevo registro
          </button>

          <div className="max-h-80 space-y-1 overflow-y-auto pr-1 text-sm">
            {clients.map((client) => (
              <button
                key={client.slug}
                type="button"
                onClick={() => setSelectedSlug(client.slug)}
                className={`w-full rounded-xl px-3 py-2 text-left transition ${
                  selectedSlug === client.slug
                    ? "bg-foreground text-background"
                    : "text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
                }`}
              >
                {client.name}
                {client.isPrivate ? " · Privado" : ""}
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-5 rounded-2xl border border-foreground/10 bg-background p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              <span>Slug</span>
              <input
                value={form.slug}
                onChange={(event) => setForm((previous) => ({ ...previous, slug: event.target.value }))}
                readOnly={selectedSlug !== "new"}
                title={
                  selectedSlug !== "new"
                    ? "El slug no puede cambiarse después de crear el registro"
                    : undefined
                }
                className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background read-only:cursor-not-allowed read-only:opacity-55"
                placeholder="ej. atlas-labs"
              />
            </label>

            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              <span>Nombre</span>
              <input
                value={form.name}
                onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
                className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
              />
            </label>

            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              <span>Sector (ES)</span>
              <input
                value={form.sector.es}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    sector: { ...previous.sector, es: event.target.value },
                  }))
                }
                className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
              />
            </label>

            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              <span>Sector (EN)</span>
              <input
                value={form.sector.en}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    sector: { ...previous.sector, en: event.target.value },
                  }))
                }
                className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
              />
            </label>

            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              <span>Tipo</span>
              <select
                value={form.kind}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, kind: event.target.value as ClientKind }))
                }
                className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
              >
                {CLIENT_KINDS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              <span>Orden (opcional)</span>
              <input
                value={form.order}
                onChange={(event) => setForm((previous) => ({ ...previous, order: event.target.value }))}
                className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
                placeholder="ej. 10"
              />
            </label>

            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60 sm:col-span-2">
              <span>Sitio web</span>
              <input
                value={form.website}
                onChange={(event) => setForm((previous) => ({ ...previous, website: event.target.value }))}
                className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
                placeholder="https://"
              />
            </label>

            <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.isPrivate}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, isPrivate: event.target.checked }))
                }
                className="h-4 w-4 rounded border border-foreground/30"
              />
              <span>Ocultar cliente del sitio público (privado)</span>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              <span>Resumen (ES)</span>
              <textarea
                value={form.summary.es}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    summary: { ...previous.summary, es: event.target.value },
                  }))
                }
                className="min-h-[96px] w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
              />
            </label>

            <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              <span>Resumen (EN)</span>
              <textarea
                value={form.summary.en}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    summary: { ...previous.summary, en: event.target.value },
                  }))
                }
                className="min-h-[96px] w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
              />
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                Identidad visual
              </span>
              {cloudinaryReady && (
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-foreground/15 px-4 py-1 text-xs font-semibold text-foreground/70 transition hover:border-foreground/40 hover:text-foreground">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];

                      if (file) {
                        try {
                          const result = await uploadToCloudinary(file, `clients/${form.slug || "nuevo"}`);
                          setForm((previous) => ({
                            ...previous,
                            image: {
                              ...previous.image,
                              publicId: result.publicId,
                              src: result.src,
                            },
                          }));
                        } catch (error) {
                          console.error(error);
                          setMessage(error instanceof Error ? error.message : "Error al subir la imagen");
                        }
                      }
                    }}
                  />
                  Subir desde Cloudinary
                </label>
              )}
              {cloudinaryReady && openCloudinaryPicker && (
                <button
                  type="button"
                  onClick={() =>
                    openCloudinaryPicker({
                      folder: form.slug.trim() ? `clients/${form.slug.trim()}` : "clients",
                      onSelect: (asset) => {
                        setForm((previous) => ({
                          ...previous,
                          image: {
                            ...previous.image,
                            publicId: asset.publicId,
                            src: asset.url,
                          },
                        }));
                        setMessage("Imagen asignada desde Cloudinary");
                      },
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-full border border-foreground/15 px-4 py-1 text-xs font-semibold text-foreground/70 transition hover:border-foreground/40 hover:text-foreground"
                >
                  Elegir existente
                </button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                <span>URL</span>
                <input
                  value={form.image.src}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      image: { ...previous.image, src: event.target.value },
                    }))
                  }
                  className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
                  placeholder="https://res.cloudinary.com/… o /images/…"
                />
              </label>

              <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                <span>Public ID</span>
                <input
                  value={form.image.publicId}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      image: { ...previous.image, publicId: event.target.value },
                    }))
                  }
                  className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
                  placeholder="clients/atlas/logo"
                />
              </label>

              <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                <span>Alt (ES)</span>
                <input
                  value={form.image.alt.es}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      image: {
                        ...previous.image,
                        alt: { ...previous.image.alt, es: event.target.value },
                      },
                    }))
                  }
                  className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
                />
              </label>

              <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                <span>Alt (EN)</span>
                <input
                  value={form.image.alt.en}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      image: {
                        ...previous.image,
                        alt: { ...previous.image.alt, en: event.target.value },
                      },
                    }))
                  }
                  className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
                />
              </label>

              <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                <span>Nota al pie (ES)</span>
                <input
                  value={form.image.footnote.es}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      image: {
                        ...previous.image,
                        footnote: { ...previous.image.footnote, es: event.target.value },
                      },
                    }))
                  }
                  className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
                  placeholder="Crédito o contexto de la imagen"
                />
              </label>

              <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                <span>Nota al pie (EN)</span>
                <input
                  value={form.image.footnote.en}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      image: {
                        ...previous.image,
                        footnote: { ...previous.image.footnote, en: event.target.value },
                      },
                    }))
                  }
                  className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
                  placeholder="Image credit or caption"
                />
              </label>
            </div>
          </div>

          {message && (
            <p className="rounded-xl border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground/70">
              {message}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={status !== "idle"}
              className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:bg-foreground/90 disabled:opacity-60"
            >
              {status === "saving" ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={status !== "idle"}
              className="inline-flex items-center gap-2 rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            >
              {status === "deleting" ? "Eliminando…" : "Eliminar"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

const DescriptionImageEditor = ({
  image,
  folder,
  cloudinaryReady,
  openCloudinaryPicker,
  onChange,
  onRemove,
  onMessage,
}: {
  image: ImageField;
  folder: string;
  cloudinaryReady: boolean;
  openCloudinaryPicker?: (options: CloudinaryPickerOptions) => void;
  onChange: (image: ImageField) => void;
  onRemove: () => void;
  onMessage: (message: string) => void;
}) => {
  const update = (changes: Partial<ImageField>) => onChange({ ...image, ...changes });

  return (
    <div className="space-y-3 rounded-2xl border border-foreground/10 bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
          Imagen del bloque
        </span>
        <div className="flex flex-wrap gap-2">
          {cloudinaryReady ? (
            <label className="inline-flex cursor-pointer items-center rounded-full border border-foreground/15 px-3 py-1 text-xs font-semibold text-foreground/70 transition hover:border-foreground/40 hover:text-foreground">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;

                  try {
                    const result = await uploadToCloudinary(file, folder);
                    update({ publicId: result.publicId, src: result.src });
                    onMessage("Imagen del párrafo subida correctamente");
                  } catch (error) {
                    console.error(error);
                    onMessage(
                      error instanceof Error ? error.message : "Error al subir la imagen",
                    );
                  }
                }}
              />
              Subir
            </label>
          ) : null}
          {cloudinaryReady && openCloudinaryPicker ? (
            <button
              type="button"
              onClick={() =>
                openCloudinaryPicker({
                  folder,
                  onSelect: (asset) => {
                    update({ publicId: asset.publicId, src: asset.url });
                    onMessage("Imagen del párrafo seleccionada desde Cloudinary");
                  },
                })
              }
              className="rounded-full border border-foreground/15 px-3 py-1 text-xs font-semibold text-foreground/70 transition hover:border-foreground/40 hover:text-foreground"
            >
              Elegir existente
            </button>
          ) : null}
          <button
            type="button"
            onClick={onRemove}
            className="rounded-full border border-foreground/15 px-3 py-1 text-xs font-semibold text-foreground/70 transition hover:border-red-300 hover:text-red-600"
          >
            Quitar
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
          <span>URL</span>
          <input
            value={image.src}
            onChange={(event) => update({ src: event.target.value })}
            className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm normal-case tracking-normal outline-none transition focus:border-foreground/40 focus:bg-background"
            placeholder="https://res.cloudinary.com/… o /images/…"
          />
        </label>
        <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
          <span>Public ID</span>
          <input
            value={image.publicId}
            onChange={(event) => update({ publicId: event.target.value })}
            className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm normal-case tracking-normal outline-none transition focus:border-foreground/40 focus:bg-background"
          />
        </label>
        {(["es", "en"] as const).map((language) => (
          <label
            key={`${image.id}-alt-${language}`}
            className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60"
          >
            <span>Alt ({language.toUpperCase()})</span>
            <input
              value={image.alt[language]}
              onChange={(event) =>
                update({ alt: { ...image.alt, [language]: event.target.value } })
              }
              className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm normal-case tracking-normal outline-none transition focus:border-foreground/40 focus:bg-background"
            />
          </label>
        ))}
        {(["es", "en"] as const).map((language) => (
          <label
            key={`${image.id}-footnote-${language}`}
            className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60"
          >
            <span>Nota al pie ({language.toUpperCase()})</span>
            <input
              value={image.footnote[language]}
              onChange={(event) =>
                update({
                  footnote: { ...image.footnote, [language]: event.target.value },
                })
              }
              className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm normal-case tracking-normal outline-none transition focus:border-foreground/40 focus:bg-background"
            />
          </label>
        ))}
      </div>
    </div>
  );
};

const ProjectManager = ({
  projects,
  clients,
  cloudinaryReady,
  openCloudinaryPicker,
}: {
  projects: Project[];
  clients: Client[];
  cloudinaryReady: boolean;
  openCloudinaryPicker?: (options: CloudinaryPickerOptions) => void;
}) => {
  const router = useRouter();
  const [selectedSlug, setSelectedSlug] = useState<string>("new");
  const [status, setStatus] = useState<"idle" | "saving" | "deleting">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [newCategoryInput, setNewCategoryInput] = useState("");

  const emptyForm = useMemo(
    () => ({
      slug: "",
      name: createLocaleField(),
      projectsMenuLabel: createLocaleField(),
      showInProjectsMenu: false,
      projectsMenuOrder: "",
      homeLabel: createLocaleField(),
      homeColor: "",
      showOnHome: false,
      homeOrder: "",
      subtitle: createLocaleField(),
      categories: [] as ProjectCategory[],
      year: "",
      startYear: "",
      endYear: "",
      isOngoing: false,
      client: createLocaleField(),
      location: createLocaleField(),
      cover: createImageField(randomId()),
      gallery: [] as ImageField[],
      video: null as ProjectVideoField | null,
      description: [createDescriptionField(randomId())],
      meta: [] as ProjectMetaField[],
      entities: [] as string[],
      order: "",
      isPrivate: false,
    }),
    [],
  );

  const [form, setForm] = useState({ ...emptyForm });

  const availableCategories = useMemo(() => {
    const unique = new Set<ProjectCategory>(Object.keys(PROJECT_CATEGORY_LABELS));

    projects.forEach((project) => {
      project.categories.forEach((category) => unique.add(category));
    });

    form.categories.forEach((category) => unique.add(category));

    return Array.from(unique).sort((a, b) =>
      translateCategoryLabel("es", a).localeCompare(translateCategoryLabel("es", b)),
    );
  }, [projects, form.categories]);

  const automaticHomeColor = useMemo(() => {
    const draftSlug = form.slug.trim() || "\uffff-new-project";
    const parsedHomeOrder = Number.parseInt(form.homeOrder.trim(), 10);
    const candidates = projects
      .filter(
        (project) =>
          project.slug !== selectedSlug && project.showOnHome && !project.isPrivate,
      )
      .map((project) => ({ slug: project.slug, homeOrder: project.homeOrder }));

    if (form.showOnHome && !form.isPrivate) {
      candidates.push({
        slug: draftSlug,
        homeOrder: Number.isNaN(parsedHomeOrder) ? undefined : parsedHomeOrder,
      });
    }

    candidates.sort((left, right) => {
      const leftOrder = left.homeOrder ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = right.homeOrder ?? Number.MAX_SAFE_INTEGER;
      return leftOrder === rightOrder
        ? left.slug.localeCompare(right.slug)
        : leftOrder - rightOrder;
    });

    const colorIndex = candidates.findIndex((project) => project.slug === draftSlug);
    return resolveProjectHomeColor(
      undefined,
      colorIndex >= 0 ? colorIndex : candidates.length,
    );
  }, [form.homeOrder, form.isPrivate, form.showOnHome, form.slug, projects, selectedSlug]);

  useEffect(() => {
    if (selectedSlug === "new") {
      setForm({
        ...emptyForm,
        cover: createImageField(randomId()),
        description: [createDescriptionField(randomId())],
      });
      return;
    }

    const project = projects.find((item) => item.slug === selectedSlug);

    if (project) {
      setForm({
        slug: project.slug,
        name: createLocaleField(project.name),
        projectsMenuLabel: createLocaleField(project.projectsMenuLabel),
        showInProjectsMenu: project.showInProjectsMenu,
        projectsMenuOrder:
          project.projectsMenuOrder !== undefined ? String(project.projectsMenuOrder) : "",
        homeLabel: createLocaleField(project.homeLabel),
        homeColor: project.homeColor ?? "",
        showOnHome: project.showOnHome,
        homeOrder: project.homeOrder !== undefined ? String(project.homeOrder) : "",
        subtitle: createLocaleField(project.subtitle),
        categories: [...project.categories],
        year: project.year,
        startYear: project.startYear ? String(project.startYear) : "",
        endYear: project.isOngoing ? "" : project.endYear ? String(project.endYear) : "",
        isOngoing: Boolean(project.isOngoing),
        client: createLocaleField(project.client),
        location: createLocaleField(project.location),
        cover: createImageField(randomId(), project.cover),
        gallery: project.gallery.map((image) => createImageField(randomId(), image)),
        video: project.video
          ? { url: project.video.url, title: createLocaleField(project.video.title) }
          : null,
        description:
          project.description.length > 0
            ? project.description.map((paragraph) => createDescriptionField(randomId(), paragraph))
            : [createDescriptionField(randomId())],
        meta: project.meta.map((item) => createMetaField(randomId(), item)),
        entities: project.entities.map((entity) => entity.slug),
        order: project.order !== undefined ? String(project.order) : "",
        isPrivate: Boolean(project.isPrivate),
      });
    }
  }, [selectedSlug, projects, emptyForm]);

  const ensureDescription = () => {
    setForm((previous) => ({
      ...previous,
      description:
        previous.description.length === 0
          ? [createDescriptionField(randomId())]
          : previous.description,
    }));
  };

  useEffect(() => {
    ensureDescription();
  }, [selectedSlug]);

  const handleAddCategory = () => {
    const slug = slugifyCategory(newCategoryInput);

    if (!slug) {
      setMessage("Escribe una categoría válida para agregarla");
      return;
    }

    setForm((previous) => ({
      ...previous,
      categories: previous.categories.includes(slug)
        ? previous.categories
        : [...previous.categories, slug],
    }));
    setNewCategoryInput("");
  };

  const buildPayload = () => {
    if (!form.slug.trim()) {
      throw new Error("El proyecto necesita un slug");
    }

    const startYearValue = form.startYear.trim();
    const endYearValue = form.endYear.trim();

    const categories = Array.from(
      new Set(
        form.categories
          .map((category) => slugifyCategory(category))
          .map((category) => category.trim())
          .filter((category) => category.length > 0),
      ),
    );

    if (!form.year.trim() && !startYearValue && !endYearValue && !form.isOngoing) {
      throw new Error("Agrega al menos un año de inicio o fin");
    }

    if (!imageHasData(form.cover)) {
      throw new Error("Agrega una imagen principal del proyecto");
    }

    const description = form.description
      .filter((paragraph) => hasLocaleContent(paragraph.text))
      .map((paragraph, paragraphIndex) => {
        const images = paragraph.images
          .filter(imageHasData)
          .map((image, imageIndex) => ({
            src: image.src.trim() || undefined,
            publicId: image.publicId.trim() || undefined,
            alt: requireLocaleField(
              image.alt,
              `el texto alternativo de la imagen ${imageIndex + 1} del párrafo ${paragraphIndex + 1}`,
            ),
            footnote: normalizeOptionalLocaleField(image.footnote),
          }));

        return {
          text: requireLocaleField(
            paragraph.text,
            `el texto del párrafo ${paragraphIndex + 1}`,
          ),
          ...(paragraph.mediaLayout && images.length > 0
            ? {
                media: {
                  layout: paragraph.mediaLayout,
                  images:
                    paragraph.mediaLayout === "gallery" ? images : images.slice(0, 1),
                },
              }
            : {}),
        };
      });

    if (description.length === 0) {
      throw new Error("Agrega al menos un párrafo de descripción");
    }

    const projectName = requireLocaleField(form.name, "el nombre del proyecto");
    const homeLabel = normalizeOptionalLocaleField(form.homeLabel);
    const homeColor = normalizeProjectHomeColor(form.homeColor);

    if (form.homeColor.trim() && !homeColor) {
      throw new Error("El color para Home debe tener el formato hexadecimal #RRGGBB");
    }

    if (form.showOnHome) {
      (["es", "en"] as const).forEach((language) => {
        const effectiveLabel = homeLabel?.[language] || projectName[language];
        const normalizedLength = normalizeWordSearchText(effectiveLabel).length;

        if (normalizedLength === 0) {
          throw new Error(
            `El nombre para Home (${language.toUpperCase()}) necesita al menos una letra A-Z o un número`,
          );
        }

        if (normalizedLength > MAX_WORD_SEARCH_WORD_LENGTH) {
          throw new Error(
            `El nombre para Home (${language.toUpperCase()}) admite hasta ${MAX_WORD_SEARCH_WORD_LENGTH} letras o números`,
          );
        }
      });
    }

    const payload: Record<string, unknown> = {
      slug: form.slug.trim(),
      name: projectName,
      projectsMenuLabel: normalizeOptionalLocaleField(form.projectsMenuLabel),
      showInProjectsMenu: form.showInProjectsMenu,
      homeLabel,
      homeColor: homeColor ?? null,
      showOnHome: form.showOnHome,
      subtitle: requireLocaleField(form.subtitle, "el subtítulo del proyecto"),
      categories,
      year:
        form.year.trim() ||
        (form.isOngoing
          ? `${startYearValue || new Date().getFullYear()}–${new Date().getFullYear()}`
          : `${startYearValue}${endYearValue ? `–${endYearValue}` : ""}`),
      startYear: startYearValue ? Number.parseInt(startYearValue, 10) : undefined,
      endYear:
        !form.isOngoing && endYearValue
          ? Number.parseInt(endYearValue, 10)
          : undefined,
      isOngoing: form.isOngoing,
      client: normalizeOptionalLocaleField(form.client) ?? "",
      location: normalizeOptionalLocaleField(form.location) ?? "",
      cover: {
        src: form.cover.src.trim() || undefined,
        publicId: form.cover.publicId.trim() || undefined,
        alt: requireLocaleField(form.cover.alt, "el texto alternativo de la portada"),
        footnote: normalizeOptionalLocaleField(form.cover.footnote),
      },
      gallery: form.gallery
        .filter(imageHasData)
        .map((image, index) => ({
          src: image.src.trim() || undefined,
          publicId: image.publicId.trim() || undefined,
          alt: requireLocaleField(image.alt, `el texto alternativo de la imagen ${index + 1}`),
          footnote: normalizeOptionalLocaleField(image.footnote),
        })),
      description,
      meta: form.meta
        .map((item) => ({
          label: trimLocaleField(item.label),
          value: trimLocaleField(item.value),
        }))
        .filter((item) => hasLocaleContent(item.label) && hasLocaleContent(item.value)),
      entities: form.entities,
      isPrivate: form.isPrivate,
    };

    if (form.video?.url.trim()) {
      payload.video = {
        url: form.video.url.trim(),
        title: requireLocaleField(form.video.title, "el título del video"),
      };
    }

    if (form.order.trim()) {
      const orderNumber = Number.parseInt(form.order.trim(), 10);
      if (!Number.isNaN(orderNumber)) {
        payload.order = orderNumber;
      }
    }

    if (form.homeOrder.trim()) {
      const homeOrderNumber = Number.parseInt(form.homeOrder.trim(), 10);
      if (!Number.isNaN(homeOrderNumber)) {
        payload.homeOrder = homeOrderNumber;
      }
    }

    if (form.projectsMenuOrder.trim()) {
      const projectsMenuOrderNumber = Number.parseInt(form.projectsMenuOrder.trim(), 10);
      if (!Number.isNaN(projectsMenuOrderNumber)) {
        payload.projectsMenuOrder = projectsMenuOrderNumber;
      }
    }

    return payload;
  };

  const handleSubmit = async () => {
    setStatus("saving");
    setMessage(null);

    try {
      const payload = buildPayload();
      const payloadSlug = typeof payload.slug === "string" ? payload.slug : "";
      const shouldCreateProject = selectedSlug === "new" || payloadSlug !== selectedSlug;
      const endpoint = shouldCreateProject ? "/api/projects" : `/api/projects/${selectedSlug}`;
      const method = shouldCreateProject ? "POST" : "PATCH";

      const response = await fetch(endpoint, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(extractApiErrorMessage(data, "No fue posible guardar el proyecto"));
      }

      setMessage(
        shouldCreateProject && selectedSlug !== "new"
          ? "Proyecto creado como entrada nueva"
          : "Proyecto guardado correctamente",
      );
      setStatus("idle");
      setSelectedSlug(payloadSlug || selectedSlug);
      router.refresh();
    } catch (error) {
      console.error(error);
      setStatus("idle");
      setMessage(error instanceof Error ? error.message : "Ocurrió un error al guardar");
    }
  };

  const handleDelete = async () => {
    if (selectedSlug === "new") {
      setForm({
        ...emptyForm,
        cover: createImageField(randomId()),
        description: [createDescriptionField(randomId())],
      });
      return;
    }

    const projectName =
      projects.find((project) => project.slug === selectedSlug)?.name.es || selectedSlug;

    if (!window.confirm(`¿Eliminar definitivamente el proyecto “${projectName}”?`)) {
      return;
    }

    setStatus("deleting");
    setMessage(null);

    try {
      const response = await fetch(`/api/projects/${selectedSlug}` as const, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(extractApiErrorMessage(data, "No fue posible eliminar el proyecto"));
      }

      setMessage("Proyecto eliminado");
      setStatus("idle");
      setSelectedSlug("new");
      router.refresh();
    } catch (error) {
      console.error(error);
      setStatus("idle");
      setMessage(error instanceof Error ? error.message : "Ocurrió un error al eliminar");
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground/90">Proyectos</h2>
        <p className="text-sm text-foreground/60">
          Administra los proyectos, galerías, videos y organizaciones relacionadas.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,220px)_1fr]">
        <aside className="space-y-2 rounded-2xl border border-foreground/10 bg-foreground/5 p-4">
          <button
            type="button"
            onClick={() => setSelectedSlug("new")}
            className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
              selectedSlug === "new"
                ? "bg-foreground text-background"
                : "text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
            }`}
          >
            + Nuevo proyecto
          </button>

          <div className="max-h-80 space-y-1 overflow-y-auto pr-1 text-sm">
            {projects.map((project) => (
              <button
                key={project.slug}
                type="button"
                onClick={() => setSelectedSlug(project.slug)}
                className={`w-full rounded-xl px-3 py-2 text-left transition ${
                  selectedSlug === project.slug
                    ? "bg-foreground text-background"
                    : "text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
                }`}
              >
                {project.name.es}
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-6 rounded-2xl border border-foreground/10 bg-background p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              <span>Slug</span>
              <input
                value={form.slug}
                onChange={(event) => setForm((previous) => ({ ...previous, slug: event.target.value }))}
                readOnly={selectedSlug !== "new"}
                title={selectedSlug !== "new" ? "El slug no puede cambiarse después de crear el proyecto" : undefined}
                className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background read-only:cursor-not-allowed read-only:opacity-55"
              />
            </label>

            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              <span>Año (etiqueta)</span>
              <input
                value={form.year}
                onChange={(event) => setForm((previous) => ({ ...previous, year: event.target.value }))}
                className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
                placeholder="2024"
              />
            </label>

            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              <span>Año de inicio</span>
              <input
                value={form.startYear}
                onChange={(event) => setForm((previous) => ({ ...previous, startYear: event.target.value }))}
                className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
                placeholder="2022"
                inputMode="numeric"
              />
            </label>

            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              <span>Año de cierre</span>
              <input
                value={form.endYear}
                onChange={(event) => setForm((previous) => ({ ...previous, endYear: event.target.value }))}
                disabled={form.isOngoing}
                className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background disabled:cursor-not-allowed disabled:opacity-45"
                placeholder="2023"
                inputMode="numeric"
              />
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60 md:col-span-2">
              <span className="flex-1 text-foreground/70">
                En curso — el cierre será siempre el año actual
              </span>
              <input
                type="checkbox"
                checked={form.isOngoing}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    isOngoing: event.target.checked,
                    endYear: event.target.checked ? "" : previous.endYear,
                  }))
                }
                className="size-4 rounded border-foreground/30 text-foreground focus:ring-foreground"
              />
            </label>

            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              <span>Título (ES)</span>
              <input
                value={form.name.es}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    name: { ...previous.name, es: event.target.value },
                  }))
                }
                className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
              />
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60 md:col-span-3">
              <span className="flex-1 text-foreground/70">Ocultar en el sitio (privado)</span>
              <input
                type="checkbox"
                checked={form.isPrivate}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    isPrivate: event.target.checked,
                  }))
                }
                className="size-4 rounded border-foreground/30 text-foreground focus:ring-foreground"
              />
            </label>

            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              <span>Título (EN)</span>
              <input
                value={form.name.en}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    name: { ...previous.name, en: event.target.value },
                  }))
                }
                className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
              />
            </label>

            <div className="space-y-4 rounded-xl border border-foreground/15 bg-foreground/[0.025] p-4 md:col-span-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-foreground/90">
                    Selector de proyectos
                  </h3>
                  <p id="projects-menu-help" className="text-xs leading-relaxed text-foreground/55">
                    Decide si esta obra aparece en el desplegable de navegación. El nombre es
                    opcional; si queda vacío, se usa el título del proyecto.
                  </p>
                </div>
                <label className="flex shrink-0 items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/65">
                  <span>{form.showInProjectsMenu ? "Visible" : "No visible"}</span>
                  <input
                    type="checkbox"
                    checked={form.showInProjectsMenu}
                    aria-describedby="projects-menu-help"
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        showInProjectsMenu: event.target.checked,
                      }))
                    }
                    className="size-4 rounded border-foreground/30 text-foreground focus:ring-foreground"
                  />
                </label>
              </div>

              <div
                className={`grid gap-4 transition md:grid-cols-3 ${
                  form.showInProjectsMenu ? "opacity-100" : "opacity-45"
                }`}
              >
                <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                  <span>Nombre para selector (ES)</span>
                  <input
                    value={form.projectsMenuLabel.es}
                    disabled={!form.showInProjectsMenu}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        projectsMenuLabel: {
                          ...previous.projectsMenuLabel,
                          es: event.target.value,
                        },
                      }))
                    }
                    className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background disabled:cursor-not-allowed"
                    placeholder="Usa el título si se deja vacío"
                  />
                </label>

                <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                  <span>Nombre para selector (EN)</span>
                  <input
                    value={form.projectsMenuLabel.en}
                    disabled={!form.showInProjectsMenu}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        projectsMenuLabel: {
                          ...previous.projectsMenuLabel,
                          en: event.target.value,
                        },
                      }))
                    }
                    className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background disabled:cursor-not-allowed"
                    placeholder="Falls back to the project title"
                  />
                </label>

                <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                  <span>Orden en selector</span>
                  <input
                    value={form.projectsMenuOrder}
                    disabled={!form.showInProjectsMenu}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        projectsMenuOrder: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background disabled:cursor-not-allowed"
                    inputMode="numeric"
                    placeholder="Opcional"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-foreground/15 bg-foreground/[0.025] p-4 md:col-span-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-foreground/90">Aparición en Home</h3>
                  <p id="home-project-help" className="text-xs leading-relaxed text-foreground/55">
                    Elige las obras que alimentan el Home y define el texto breve que aparecerá en
                    el tablero. Los espacios, signos y acentos se eliminan dentro de la cuadrícula;
                    usa nombres breves para mantener las letras más grandes.
                  </p>
                </div>
                <label className="flex shrink-0 items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/65">
                  <span>{form.showOnHome ? "Incluido" : "No incluido"}</span>
                  <input
                    type="checkbox"
                    checked={form.showOnHome}
                    aria-describedby="home-project-help"
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, showOnHome: event.target.checked }))
                    }
                    className="size-4 rounded border-foreground/30 text-foreground focus:ring-foreground"
                  />
                </label>
              </div>

              <div
                className={`grid gap-4 transition md:grid-cols-2 xl:grid-cols-4 ${
                  form.showOnHome ? "opacity-100" : "opacity-45"
                }`}
              >
                <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                  <span>Nombre para Home (ES)</span>
                  <input
                    value={form.homeLabel.es}
                    disabled={!form.showOnHome}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        homeLabel: { ...previous.homeLabel, es: event.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background disabled:cursor-not-allowed"
                    placeholder="Usa el título si se deja vacío"
                  />
                </label>

                <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                  <span>Nombre para Home (EN)</span>
                  <input
                    value={form.homeLabel.en}
                    disabled={!form.showOnHome}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        homeLabel: { ...previous.homeLabel, en: event.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background disabled:cursor-not-allowed"
                    placeholder="Falls back to the project title"
                  />
                </label>

                <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                  <span>Orden en Home</span>
                  <input
                    value={form.homeOrder}
                    disabled={!form.showOnHome}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, homeOrder: event.target.value }))
                    }
                    className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background disabled:cursor-not-allowed"
                    inputMode="numeric"
                    placeholder="Opcional"
                  />
                </label>

                <div className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                  <span>Color del nombre en Home</span>
                  <div className="flex min-h-10 items-center gap-2">
                    <input
                      type="color"
                      value={
                        normalizeProjectHomeColor(form.homeColor) ?? automaticHomeColor
                      }
                      disabled={!form.showOnHome}
                      aria-label="Seleccionar color del nombre en Home"
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          homeColor: event.target.value,
                        }))
                      }
                      className="h-10 w-12 cursor-pointer rounded-lg border border-foreground/15 bg-foreground/5 p-1 disabled:cursor-not-allowed"
                    />
                    <input
                      value={form.homeColor}
                      disabled={!form.showOnHome}
                      aria-label="Color hexadecimal del nombre en Home"
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          homeColor: event.target.value,
                        }))
                      }
                      className="min-w-0 flex-1 rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 font-mono text-sm normal-case tracking-normal outline-none transition focus:border-foreground/40 focus:bg-background disabled:cursor-not-allowed"
                      placeholder="Automático"
                      spellCheck={false}
                    />
                    <button
                      type="button"
                      disabled={!form.showOnHome || !form.homeColor}
                      onClick={() =>
                        setForm((previous) => ({ ...previous, homeColor: "" }))
                      }
                      className="min-h-10 rounded-xl border border-foreground/15 px-3 text-[10px] uppercase tracking-[0.12em] transition hover:border-foreground/40 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Auto
                    </button>
                  </div>
                  <p className="pt-1 text-[10px] normal-case leading-relaxed tracking-normal text-foreground/45">
                    Automático: {automaticHomeColor}. El fondo del Home es negro; procura usar un
                    color luminoso.
                  </p>
                </div>
              </div>
            </div>

            {form.isPrivate && (
              <p className="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900 md:col-span-3">
                Mientras el proyecto sea privado no aparecerá ni en el selector ni en el Home,
                aunque estas selecciones permanezcan guardadas.
              </p>
            )}

            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              <span>Subtítulo (ES)</span>
              <input
                value={form.subtitle.es}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    subtitle: { ...previous.subtitle, es: event.target.value },
                  }))
                }
                className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
              />
            </label>

            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              <span>Subtítulo (EN)</span>
              <input
                value={form.subtitle.en}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    subtitle: { ...previous.subtitle, en: event.target.value },
                  }))
                }
                className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
              />
            </label>

            <div className="space-y-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60 md:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>Categorías (opcional)</span>
                <div className="flex flex-1 flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-foreground/60 sm:flex-none">
                  <input
                    value={newCategoryInput}
                    onChange={(event) => setNewCategoryInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleAddCategory();
                      }
                    }}
                    className="min-w-[200px] flex-1 rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-foreground/70 outline-none transition focus:border-foreground/40 focus:bg-background sm:flex-none"
                    placeholder="Nueva categoría"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="rounded-full border border-foreground/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/80 transition hover:border-foreground/40 hover:text-foreground"
                  >
                    Agregar
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((category) => (
                  <label
                    key={category}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      form.categories.includes(category)
                        ? "border-foreground bg-foreground text-background"
                        : "border-foreground/15 text-foreground/70 hover:border-foreground/40 hover:text-foreground"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={form.categories.includes(category)}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          categories: event.target.checked
                            ? [...previous.categories, category]
                            : previous.categories.filter((item) => item !== category),
                        }))
                      }
                    />
                    <span>{translateCategoryLabel("es", category)}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              <span>Entidad o contexto (ES, opcional)</span>
              <input
                value={form.client.es}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    client: { ...previous.client, es: event.target.value },
                  }))
                }
                className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
              />
            </label>

            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              <span>Entidad o contexto (EN, opcional)</span>
              <input
                value={form.client.en}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    client: { ...previous.client, en: event.target.value },
                  }))
                }
                className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
              />
            </label>

            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              <span>Ubicación (ES, opcional)</span>
              <input
                value={form.location.es}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    location: { ...previous.location, es: event.target.value },
                  }))
                }
                className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
              />
            </label>

            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              <span>Ubicación (EN, opcional)</span>
              <input
                value={form.location.en}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    location: { ...previous.location, en: event.target.value },
                  }))
                }
                className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
              />
            </label>

          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                Portada
              </span>
              {cloudinaryReady && (
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-foreground/15 px-4 py-1 text-xs font-semibold text-foreground/70 transition hover:border-foreground/40 hover:text-foreground">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];

                      if (file) {
                        try {
                          const result = await uploadToCloudinary(
                            file,
                            `projects/${form.slug || "nuevo"}/cover`,
                          );
                          setForm((previous) => ({
                            ...previous,
                            cover: {
                              ...previous.cover,
                              publicId: result.publicId,
                              src: result.src,
                            },
                          }));
                        } catch (error) {
                          console.error(error);
                          setMessage(error instanceof Error ? error.message : "Error al subir la portada");
                        }
                      }
                    }}
                  />
                  Subir portada
                </label>
              )}
              {cloudinaryReady && openCloudinaryPicker && (
                <button
                  type="button"
                  onClick={() =>
                    openCloudinaryPicker({
                      folder: form.slug.trim() ? `projects/${form.slug.trim()}` : "projects",
                      onSelect: (asset) => {
                        setForm((previous) => ({
                          ...previous,
                          cover: {
                            ...previous.cover,
                            publicId: asset.publicId,
                            src: asset.url,
                          },
                        }));
                        setMessage("Portada actualizada desde Cloudinary");
                      },
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-full border border-foreground/15 px-4 py-1 text-xs font-semibold text-foreground/70 transition hover:border-foreground/40 hover:text-foreground"
                >
                  Elegir existente
                </button>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                <span>URL</span>
                <input
                  value={form.cover.src}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      cover: { ...previous.cover, src: event.target.value },
                    }))
                  }
                  className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
                  placeholder="https://res.cloudinary.com/… o /images/…"
                />
              </label>

              <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                <span>Public ID</span>
                <input
                  value={form.cover.publicId}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      cover: { ...previous.cover, publicId: event.target.value },
                    }))
                  }
                  className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
                />
              </label>

              <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                <span>Alt (ES)</span>
                <input
                  value={form.cover.alt.es}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      cover: {
                        ...previous.cover,
                        alt: { ...previous.cover.alt, es: event.target.value },
                      },
                    }))
                  }
                  className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
                />
              </label>

              <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                <span>Alt (EN)</span>
                <input
                  value={form.cover.alt.en}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      cover: {
                        ...previous.cover,
                        alt: { ...previous.cover.alt, en: event.target.value },
                      },
                    }))
                  }
                  className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
                />
              </label>

              <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                <span>Nota al pie (ES)</span>
                <input
                  value={form.cover.footnote.es}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      cover: {
                        ...previous.cover,
                        footnote: { ...previous.cover.footnote, es: event.target.value },
                      },
                    }))
                  }
                  className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
                  placeholder="Crédito o nota"
                />
              </label>

              <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                <span>Nota al pie (EN)</span>
                <input
                  value={form.cover.footnote.en}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      cover: {
                        ...previous.cover,
                        footnote: { ...previous.cover.footnote, en: event.target.value },
                      },
                    }))
                  }
                  className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
                  placeholder="Credit or caption"
                />
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                Galería
              </span>
              <button
                type="button"
                onClick={() =>
                  setForm((previous) => ({
                    ...previous,
                    gallery: [...previous.gallery, createImageField(randomId())],
                  }))
                }
                className="rounded-full border border-foreground/15 px-3 py-1 text-xs font-semibold text-foreground/70 transition hover:border-foreground/40 hover:text-foreground"
              >
                Añadir imagen
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {form.gallery.map((image) => (
                <div key={image.id} className="space-y-2 rounded-2xl border border-foreground/10 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                      Imagen
                    </span>
                    <div className="flex items-center gap-2">
                      {cloudinaryReady && (
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-foreground/15 px-3 py-1 text-xs font-semibold text-foreground/70 transition hover:border-foreground/40 hover:text-foreground">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (event) => {
                              const file = event.target.files?.[0];

                              if (file) {
                                try {
                                  const result = await uploadToCloudinary(
                                    file,
                                    `projects/${form.slug || "nuevo"}/gallery`,
                                  );
                                  setForm((previous) => ({
                                    ...previous,
                                    gallery: previous.gallery.map((item) =>
                                      item.id === image.id
                                        ? { ...item, publicId: result.publicId, src: result.src }
                                        : item,
                                    ),
                                  }));
                                } catch (error) {
                                  console.error(error);
                                  setMessage(error instanceof Error ? error.message : "Error al subir la imagen");
                                }
                              }
                            }}
                          />
                          Subir
                        </label>
                      )}
                      {cloudinaryReady && openCloudinaryPicker && (
                        <button
                          type="button"
                          onClick={() =>
                            openCloudinaryPicker({
                              folder: form.slug.trim() ? `projects/${form.slug.trim()}/gallery` : "projects",
                              onSelect: (asset) => {
                                setForm((previous) => ({
                                  ...previous,
                                  gallery: previous.gallery.map((item) =>
                                    item.id === image.id
                                      ? { ...item, publicId: asset.publicId, src: asset.url }
                                      : item,
                                  ),
                                }));
                                setMessage("Imagen de galería actualizada desde Cloudinary");
                              },
                            })
                          }
                          className="rounded-full border border-foreground/15 px-3 py-1 text-xs font-semibold text-foreground/70 transition hover:border-foreground/40 hover:text-foreground"
                        >
                          Elegir existente
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setForm((previous) => ({
                            ...previous,
                            gallery: previous.gallery.filter((item) => item.id !== image.id),
                          }))
                        }
                        className="rounded-full border border-foreground/15 px-3 py-1 text-xs font-semibold text-foreground/70 transition hover:border-foreground/40 hover:text-foreground"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                      <span>URL</span>
                      <input
                        value={image.src}
                        onChange={(event) =>
                          setForm((previous) => ({
                            ...previous,
                            gallery: previous.gallery.map((item) =>
                              item.id === image.id
                                ? { ...item, src: event.target.value }
                                : item,
                            ),
                          }))
                        }
                        className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
                        placeholder="https://res.cloudinary.com/… o /images/…"
                      />
                    </label>

                    <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                      <span>Public ID</span>
                      <input
                        value={image.publicId}
                        onChange={(event) =>
                          setForm((previous) => ({
                            ...previous,
                            gallery: previous.gallery.map((item) =>
                              item.id === image.id
                                ? { ...item, publicId: event.target.value }
                                : item,
                            ),
                          }))
                        }
                        className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
                      />
                    </label>

                    <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                      <span>Alt (ES)</span>
                      <input
                        value={image.alt.es}
                        onChange={(event) =>
                          setForm((previous) => ({
                            ...previous,
                            gallery: previous.gallery.map((item) =>
                              item.id === image.id
                                ? { ...item, alt: { ...item.alt, es: event.target.value } }
                                : item,
                            ),
                          }))
                        }
                        className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
                      />
                    </label>

                    <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                      <span>Alt (EN)</span>
                      <input
                        value={image.alt.en}
                        onChange={(event) =>
                          setForm((previous) => ({
                            ...previous,
                            gallery: previous.gallery.map((item) =>
                              item.id === image.id
                                ? { ...item, alt: { ...item.alt, en: event.target.value } }
                                : item,
                            ),
                          }))
                        }
                        className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
                      />
                    </label>

                    <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                      <span>Nota al pie (ES)</span>
                      <input
                        value={image.footnote.es}
                        onChange={(event) =>
                          setForm((previous) => ({
                            ...previous,
                            gallery: previous.gallery.map((item) =>
                              item.id === image.id
                                ? { ...item, footnote: { ...item.footnote, es: event.target.value } }
                                : item,
                            ),
                          }))
                        }
                        className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
                        placeholder="Crédito o nota"
                      />
                    </label>

                    <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                      <span>Nota al pie (EN)</span>
                      <input
                        value={image.footnote.en}
                        onChange={(event) =>
                          setForm((previous) => ({
                            ...previous,
                            gallery: previous.gallery.map((item) =>
                              item.id === image.id
                                ? { ...item, footnote: { ...item.footnote, en: event.target.value } }
                                : item,
                            ),
                          }))
                        }
                        className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
                        placeholder="Credit or caption"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                Descripción
              </span>
              <button
                type="button"
                onClick={() =>
                  setForm((previous) => ({
                    ...previous,
                    description: [...previous.description, createDescriptionField(randomId())],
                  }))
                }
                className="rounded-full border border-foreground/15 px-3 py-1 text-xs font-semibold text-foreground/70 transition hover:border-foreground/40 hover:text-foreground"
              >
                Añadir párrafo
              </button>
            </div>

            <p className="text-xs leading-5 text-foreground/55">
              Cada párrafo puede llevar una imagen con tamaño propio o una galería. Es completamente opcional.
            </p>

            <div className="space-y-5">
              {form.description.map((paragraph, paragraphIndex) => (
                <div
                  key={paragraph.id}
                  className="space-y-4 rounded-2xl border border-foreground/10 bg-foreground/[0.025] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                      Párrafo {paragraphIndex + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((previous) => ({
                          ...previous,
                          description: previous.description.filter(
                            (item) => item.id !== paragraph.id,
                          ),
                        }))
                      }
                      className="rounded-full border border-foreground/15 px-3 py-1 text-xs font-semibold text-foreground/70 transition hover:border-red-300 hover:text-red-600"
                    >
                      Quitar párrafo
                    </button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {(["es", "en"] as const).map((language) => (
                      <label
                        key={`${paragraph.id}-text-${language}`}
                        className="space-y-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60"
                      >
                        <span>Texto ({language.toUpperCase()})</span>
                        <textarea
                          value={paragraph.text[language]}
                          onChange={(event) =>
                            setForm((previous) => ({
                              ...previous,
                              description: previous.description.map((item) =>
                                item.id === paragraph.id
                                  ? {
                                      ...item,
                                      text: {
                                        ...item.text,
                                        [language]: event.target.value,
                                      },
                                    }
                                  : item,
                              ),
                            }))
                          }
                          className="min-h-[120px] w-full rounded-xl border border-foreground/15 bg-background px-3 py-2 text-sm normal-case tracking-normal outline-none transition focus:border-foreground/40"
                        />
                      </label>
                    ))}
                  </div>

                  <label className="block max-w-md space-y-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                    <span>Medios después del párrafo (opcional)</span>
                    <select
                      value={paragraph.mediaLayout}
                      onChange={(event) => {
                        const mediaLayout = event.target.value as
                          | ProjectDescriptionMediaLayout
                          | "";
                        setForm((previous) => ({
                          ...previous,
                          description: previous.description.map((item) =>
                            item.id === paragraph.id
                              ? {
                                  ...item,
                                  mediaLayout,
                                  images:
                                    mediaLayout && item.images.length === 0
                                      ? [createImageField(randomId())]
                                      : item.images,
                                }
                              : item,
                          ),
                        }));
                      }}
                      className="w-full rounded-xl border border-foreground/15 bg-background px-3 py-2 text-sm normal-case tracking-normal outline-none transition focus:border-foreground/40"
                    >
                      <option value="">Sin imagen</option>
                      <option value="small">Imagen pequeña</option>
                      <option value="medium">Imagen mediana</option>
                      <option value="large">Imagen grande</option>
                      <option value="gallery">Galería</option>
                    </select>
                  </label>

                  {paragraph.mediaLayout ? (
                    <div className="space-y-3 border-t border-foreground/10 pt-4">
                      {(paragraph.mediaLayout === "gallery" || paragraph.images.length === 0) ? (
                        <button
                          type="button"
                          onClick={() =>
                            setForm((previous) => ({
                              ...previous,
                              description: previous.description.map((item) =>
                                item.id === paragraph.id
                                  ? {
                                      ...item,
                                      images: [...item.images, createImageField(randomId())],
                                    }
                                  : item,
                              ),
                            }))
                          }
                          className="rounded-full border border-foreground/15 px-3 py-1 text-xs font-semibold text-foreground/70 transition hover:border-foreground/40 hover:text-foreground"
                        >
                          {paragraph.mediaLayout === "gallery"
                            ? "Añadir imagen a la galería"
                            : "Añadir imagen"}
                        </button>
                      ) : null}

                      <div className="grid gap-4 xl:grid-cols-2">
                        {(paragraph.mediaLayout === "gallery"
                          ? paragraph.images
                          : paragraph.images.slice(0, 1)
                        ).map((image) => (
                          <DescriptionImageEditor
                            key={image.id}
                            image={image}
                            folder={`projects/${form.slug.trim() || "nuevo"}/description`}
                            cloudinaryReady={cloudinaryReady}
                            openCloudinaryPicker={openCloudinaryPicker}
                            onMessage={setMessage}
                            onChange={(updatedImage) =>
                              setForm((previous) => ({
                                ...previous,
                                description: previous.description.map((item) =>
                                  item.id === paragraph.id
                                    ? {
                                        ...item,
                                        images: item.images.map((currentImage) =>
                                          currentImage.id === image.id
                                            ? updatedImage
                                            : currentImage,
                                        ),
                                      }
                                    : item,
                                ),
                              }))
                            }
                            onRemove={() =>
                              setForm((previous) => ({
                                ...previous,
                                description: previous.description.map((item) =>
                                  item.id === paragraph.id
                                    ? {
                                        ...item,
                                        images: item.images.filter(
                                          (currentImage) => currentImage.id !== image.id,
                                        ),
                                      }
                                    : item,
                                ),
                              }))
                            }
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                Campos adicionales
              </span>
              <button
                type="button"
                onClick={() =>
                  setForm((previous) => ({
                    ...previous,
                    meta: [...previous.meta, createMetaField(randomId())],
                  }))
                }
                className="rounded-full border border-foreground/15 px-3 py-1 text-xs font-semibold text-foreground/70 transition hover:border-foreground/40 hover:text-foreground"
              >
                Añadir campo
              </button>
            </div>

            <div className="space-y-4">
              {form.meta.map((item) => (
                <div key={item.id} className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                    <span>Etiqueta (ES)</span>
                    <input
                      value={item.label.es}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          meta: previous.meta.map((metaItem) =>
                            metaItem.id === item.id
                              ? { ...metaItem, label: { ...metaItem.label, es: event.target.value } }
                              : metaItem,
                          ),
                        }))
                      }
                      className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
                    />
                  </label>

                  <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                    <span>Etiqueta (EN)</span>
                    <input
                      value={item.label.en}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          meta: previous.meta.map((metaItem) =>
                            metaItem.id === item.id
                              ? { ...metaItem, label: { ...metaItem.label, en: event.target.value } }
                              : metaItem,
                          ),
                        }))
                      }
                      className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
                    />
                  </label>

                  <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                    <span>Valor (ES)</span>
                    <input
                      value={item.value.es}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          meta: previous.meta.map((metaItem) =>
                            metaItem.id === item.id
                              ? { ...metaItem, value: { ...metaItem.value, es: event.target.value } }
                              : metaItem,
                          ),
                        }))
                      }
                      className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
                    />
                  </label>

                  <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                    <span>Valor (EN)</span>
                    <input
                      value={item.value.en}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          meta: previous.meta.map((metaItem) =>
                            metaItem.id === item.id
                              ? { ...metaItem, value: { ...metaItem.value, en: event.target.value } }
                              : metaItem,
                          ),
                        }))
                      }
                      className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
                    />
                  </label>

                  <div className="md:col-span-2">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((previous) => ({
                          ...previous,
                          meta: previous.meta.filter((metaItem) => metaItem.id !== item.id),
                        }))
                      }
                      className="rounded-full border border-foreground/15 px-3 py-1 text-xs font-semibold text-foreground/70 transition hover:border-foreground/40 hover:text-foreground"
                    >
                      Quitar campo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              Video (opcional)
            </span>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                <span>URL (YouTube o Vimeo)</span>
                <input
                  value={form.video?.url ?? ""}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      video: {
                        url: event.target.value,
                        title: previous.video ? previous.video.title : createLocaleField(),
                      },
                    }))
                  }
                  className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
                />
              </label>

              <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                <span>Título (ES)</span>
                <input
                  value={form.video?.title.es ?? ""}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      video: {
                        url: previous.video?.url ?? "",
                        title: {
                          es: event.target.value,
                          en: previous.video?.title.en ?? "",
                        },
                      },
                    }))
                  }
                  className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
                />
              </label>

              <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                <span>Título (EN)</span>
                <input
                  value={form.video?.title.en ?? ""}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      video: {
                        url: previous.video?.url ?? "",
                        title: {
                          es: previous.video?.title.es ?? "",
                          en: event.target.value,
                        },
                      },
                    }))
                  }
                  className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:bg-background"
                />
              </label>

              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={() =>
                    setForm((previous) => ({
                      ...previous,
                      video: null,
                    }))
                  }
                  className="rounded-full border border-foreground/15 px-3 py-1 text-xs font-semibold text-foreground/70 transition hover:border-foreground/40 hover:text-foreground"
                >
                  Quitar video
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              Organizaciones asociadas (opcional)
            </span>
            <p className="text-xs leading-relaxed text-foreground/55">
              Puedes dejar esta sección sin selecciones. Los registros privados pueden conservarse
              asociados, pero no se mostrarán en los créditos públicos.
            </p>
            <div className="grid gap-2 md:grid-cols-2">
              {clients.map((client) => (
                <label
                  key={client.slug}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition ${
                    form.entities.includes(client.slug)
                      ? "border-foreground bg-foreground/10 text-foreground"
                      : "border-foreground/15 text-foreground/70 hover:border-foreground/40 hover:text-foreground"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.entities.includes(client.slug)}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        entities: event.target.checked
                          ? [...previous.entities, client.slug]
                          : previous.entities.filter((slug) => slug !== client.slug),
                      }))
                    }
                  />
                  <span>
                    {client.name}
                    {client.isPrivate ? " · Privado" : ""}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {message && (
            <p className="rounded-xl border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground/70">
              {message}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={status !== "idle"}
              className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:bg-foreground/90 disabled:opacity-60"
            >
              {status === "saving" ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={status !== "idle"}
              className="inline-flex items-center gap-2 rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            >
              {status === "deleting" ? "Eliminando…" : "Eliminar"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

type AdminSection =
  | "home"
  | "bio"
  | "projects"
  | "events"
  | "publications"
  | "contact"
  | "settings";

const ADMIN_SECTIONS: { key: AdminSection; label: string }[] = [
  { key: "home", label: "Home" },
  { key: "bio", label: "Bio" },
  { key: "projects", label: "Proyectos" },
  { key: "events", label: "Eventos" },
  { key: "publications", label: "Publicaciones" },
  { key: "contact", label: "Contacto" },
  { key: "settings", label: "Ajustes" },
];

const AdminDashboard = ({
  clients,
  projects,
  siteContent,
  artistProfile,
  events,
  publications,
  databaseReady,
  cloudinaryReady,
}: AdminDashboardProps) => {
  const { picker, openPicker, closePicker } = useCloudinaryPicker();
  const [activeAdminSection, setActiveAdminSection] = useState<AdminSection>("bio");
  const pickerCallback = cloudinaryReady ? openPicker : undefined;
  const homeProjects = useMemo(
    () =>
      projects
        .filter((project) => project.showOnHome)
        .sort((left, right) => {
          const leftOrder = left.homeOrder ?? Number.MAX_SAFE_INTEGER;
          const rightOrder = right.homeOrder ?? Number.MAX_SAFE_INTEGER;
          return leftOrder === rightOrder
            ? left.slug.localeCompare(right.slug)
            : leftOrder - rightOrder;
        }),
    [projects],
  );
  const visibleHomeProjects = homeProjects.filter((project) => !project.isPrivate);

  return (
    <div className="space-y-8">
      <header className="border-b border-foreground/15 pb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/50">
          Archivo editorial
        </p>
        <h1 className="mt-2 text-3xl font-normal tracking-[-0.035em] sm:text-5xl">
          Administrar sitio
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground/60">
          Cada apartado corresponde al contenido que aparece en el sitio público. Los campos bilingües
          permiten mantener las versiones en español e inglés desde el mismo lugar.
        </p>
      </header>

      {!databaseReady && (
        <div className="rounded-3xl border border-yellow-300 bg-yellow-50 px-6 py-5 text-sm text-yellow-900">
          Configura las variables <code>MONGODB_URI</code> y <code>MONGODB_DB</code> para habilitar el guardado en la base de
          datos. Mientras tanto, el sitio seguirá usando el contenido estático del repositorio.
        </div>
      )}

      {!cloudinaryReady && (
        <div className="rounded-3xl border border-blue-300 bg-blue-50 px-6 py-5 text-sm text-blue-900">
          Añade <code>CLOUDINARY_CLOUD_NAME</code>, <code>CLOUDINARY_API_KEY</code> y <code>CLOUDINARY_API_SECRET</code> en tu
          entorno para habilitar las cargas directas de medios. Puedes pegar URLs manualmente si ya tienes tus activos.
        </div>
      )}

      <nav
        role="tablist"
        aria-label="Apartados del administrador"
        className="sticky top-0 z-40 flex gap-1 overflow-x-auto border-y border-foreground/15 bg-background py-2"
      >
        {ADMIN_SECTIONS.map((section) => {
          const isActive = activeAdminSection === section.key;

          return (
            <button
              key={section.key}
              id={`admin-tab-${section.key}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`admin-panel-${section.key}`}
              onClick={() => setActiveAdminSection(section.key)}
              className={`min-h-11 shrink-0 border px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                isActive
                  ? "border-foreground bg-foreground text-background"
                  : "border-transparent text-foreground/60 hover:border-foreground/25 hover:text-foreground"
              }`}
            >
              {section.label}
            </button>
          );
        })}
      </nav>

      <section
        id="admin-panel-home"
        role="tabpanel"
        aria-labelledby="admin-tab-home"
        hidden={activeAdminSection !== "home"}
      >
        <div className="space-y-6 border border-foreground/15 bg-background p-5 sm:p-7">
          <header className="flex flex-col gap-4 border-b border-foreground/15 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/50">
                Portada interactiva
              </p>
              <h2 className="mt-2 text-2xl font-normal tracking-[-0.03em] sm:text-4xl">
                Home interactivo
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground/60">
                El Home se genera con las obras marcadas como “Incluir en Home”. Usa el nombre breve
                y el color definido en cada proyecto; las posiciones cambian en cada visita.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center border border-foreground/20 px-4 text-xs font-semibold uppercase tracking-[0.12em] transition hover:border-foreground"
              >
                Ver Home ↗
              </a>
              <button
                type="button"
                onClick={() => setActiveAdminSection("projects")}
                className="min-h-11 border border-foreground bg-foreground px-4 text-xs font-semibold uppercase tracking-[0.12em] text-background"
              >
                Gestionar proyectos
              </button>
            </div>
          </header>

          <div className="flex flex-wrap gap-x-8 gap-y-2 font-mono text-xs uppercase tracking-[0.12em] text-foreground/55">
            <p>
              <span className="text-foreground">{visibleHomeProjects.length}</span> visibles
            </p>
            <p>
              <span className="text-foreground">{homeProjects.length}</span> seleccionados
            </p>
            <p>Revelado automático · 5 s</p>
          </div>

          {homeProjects.length > 0 ? (
            <ol className="border-t border-foreground/15">
              {homeProjects.map((project, index) => (
                <li
                  key={project.slug}
                  className="grid gap-3 border-b border-foreground/15 py-4 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-center"
                >
                  <span className="font-mono text-xs text-foreground/45">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-base text-foreground">
                      {getProjectHomeLabel(project, "es")}
                    </p>
                    <p className="mt-1 font-mono text-xs text-foreground/50">
                      {getProjectHomeLabel(project, "en")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.1em] text-foreground/50">
                    <span className="inline-flex items-center gap-1.5">
                      <i
                        className="size-3 border border-foreground/20"
                        style={{
                          backgroundColor: resolveProjectHomeColor(project.homeColor, index),
                        }}
                        aria-hidden="true"
                      />
                      {project.homeColor ?? "automático"}
                    </span>
                    <span>Orden {project.homeOrder ?? "auto"}</span>
                    {project.isPrivate ? (
                      <span className="border border-amber-400/60 px-2 py-1 text-amber-700">
                        Privado · no visible
                      </span>
                    ) : (
                      <span className="border border-foreground/20 px-2 py-1">Visible</span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="border border-dashed border-foreground/25 p-6 text-sm leading-6 text-foreground/60">
              Todavía no hay obras seleccionadas. Entra a Proyectos, abre una obra y activa
              “Incluir en Home”.
            </div>
          )}
        </div>
      </section>

      <section
        id="admin-panel-bio"
        role="tabpanel"
        aria-labelledby="admin-tab-bio"
        hidden={activeAdminSection !== "bio"}
        className="space-y-8"
      >
        <ArtistProfileManager
          profile={artistProfile}
          databaseReady={databaseReady}
          openCloudinaryPicker={pickerCallback}
        />
        <SiteContentManager
          siteContent={siteContent}
          cloudinaryReady={cloudinaryReady}
          openCloudinaryPicker={pickerCallback}
          visibleSections={["bioPage"]}
          initialSection="bioPage"
          heading="Textos auxiliares de Bio"
          description="Etiquetas de interfaz que acompañan a la información de la artista."
        />
      </section>

      <section
        id="admin-panel-projects"
        role="tabpanel"
        aria-labelledby="admin-tab-projects"
        hidden={activeAdminSection !== "projects"}
        className="space-y-8"
      >
        <ProjectManager
          projects={projects}
          clients={clients}
          cloudinaryReady={cloudinaryReady}
          openCloudinaryPicker={pickerCallback}
        />
        <SiteContentManager
          siteContent={siteContent}
          cloudinaryReady={cloudinaryReady}
          openCloudinaryPicker={pickerCallback}
          visibleSections={["projectsPage"]}
          initialSection="projectsPage"
          heading="Textos del índice de proyectos"
          description="El contenido y la aparición de cada obra se gestionan en el editor superior."
        />
      </section>

      <section
        id="admin-panel-events"
        role="tabpanel"
        aria-labelledby="admin-tab-events"
        hidden={activeAdminSection !== "events"}
        className="space-y-8"
      >
        <ArtistEventsManager
          events={events}
          projects={projects}
          databaseReady={databaseReady}
          openCloudinaryPicker={pickerCallback}
        />
        <SiteContentManager
          siteContent={siteContent}
          cloudinaryReady={cloudinaryReady}
          openCloudinaryPicker={pickerCallback}
          visibleSections={["eventsPage"]}
          initialSection="eventsPage"
          heading="Textos de Eventos"
          description="Introducción, títulos de agenda y mensajes cuando no hay eventos publicados."
        />
      </section>

      <section
        id="admin-panel-publications"
        role="tabpanel"
        aria-labelledby="admin-tab-publications"
        hidden={activeAdminSection !== "publications"}
        className="space-y-8"
      >
        <PublicationsManager
          publications={publications}
          databaseReady={databaseReady}
          openCloudinaryPicker={pickerCallback}
        />
        <SiteContentManager
          siteContent={siteContent}
          cloudinaryReady={cloudinaryReady}
          openCloudinaryPicker={pickerCallback}
          visibleSections={["publicationsPage"]}
          initialSection="publicationsPage"
          heading="Textos de Publicaciones"
          description="Introducción, estados vacíos y etiquetas de los enlaces bibliográficos."
        />
      </section>

      <section
        id="admin-panel-contact"
        role="tabpanel"
        aria-labelledby="admin-tab-contact"
        hidden={activeAdminSection !== "contact"}
      >
        <SiteContentManager
          siteContent={siteContent}
          cloudinaryReady={cloudinaryReady}
          openCloudinaryPicker={pickerCallback}
          visibleSections={["contact", "footer"]}
          initialSection="contact"
          heading="Contacto y redes"
          description="Correo público, formulario, redes sociales y texto del pie de página."
        />
      </section>

      <section
        id="admin-panel-settings"
        role="tabpanel"
        aria-labelledby="admin-tab-settings"
        hidden={activeAdminSection !== "settings"}
        className="space-y-8"
      >
        <SiteContentManager
          siteContent={siteContent}
          cloudinaryReady={cloudinaryReady}
          openCloudinaryPicker={pickerCallback}
          visibleSections={["navigation"]}
          initialSection="navigation"
          heading="Navegación"
          description="Etiquetas del menú principal en ambos idiomas."
        />
        <ClientManager
          clients={clients}
          cloudinaryReady={cloudinaryReady}
          openCloudinaryPicker={pickerCallback}
        />
        <CloudinaryLibraryShortcut
          cloudinaryReady={cloudinaryReady}
          openCloudinaryPicker={pickerCallback}
        />
      </section>

      {cloudinaryReady && <CloudinaryLibraryDialog state={picker} onClose={closePicker} />}
    </div>
  );
};

export default AdminDashboard;
