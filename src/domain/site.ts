import type { LocaleText } from "@/lib/i18n";
import type { Service } from "@/content/services";

export type SiteCopy = {
  navigation: {
    brand: LocaleText;
    homeLabel: LocaleText;
    bioLabel: LocaleText;
    servicesLabel: LocaleText;
    clientsLabel: LocaleText;
    projectsLabel: LocaleText;
    eventsLabel: LocaleText;
    publicationsLabel: LocaleText;
    contactLabel: LocaleText;
    openMenuLabel: LocaleText;
    closeMenuLabel: LocaleText;
  };
  home: {
    heroHeadline: LocaleText;
    heroSubtitle: LocaleText;
    heroPrimaryCta: LocaleText;
    heroSecondaryCta: LocaleText;
    heroTags: LocaleText[];
    heroVideo?: {
      url?: string;
      publicId?: string;
      poster?: string;
    };
    servicesTitle: LocaleText;
    servicesCopy: LocaleText;
    servicesCta: LocaleText;
    servicesTags: LocaleText[];
    servicesBadgeLabel: LocaleText;
    servicesCardCta: LocaleText;
    projectsTitle: LocaleText;
    projectsDescription: LocaleText;
    projectsTags: LocaleText[];
    projectsBadgeLabel: LocaleText;
    projectsCardCta: LocaleText;
    projectsImageAlt: LocaleText;
    projectsCta: LocaleText;
    clientsTitle: LocaleText;
    clientsWebsiteLabel: LocaleText;
    contactCta: LocaleText;
  };
  servicesPage: {
    title: LocaleText;
    copy: LocaleText;
    ctaLabel: LocaleText;
    chips: LocaleText[];
    outcomesLabel: LocaleText;
    quickMapLabel: LocaleText;
    highlightPrimaryLabel: LocaleText;
    highlightSecondaryLabel: LocaleText;
    sessionTitle: LocaleText;
    sessionCopy: LocaleText;
    talkCtaLabel: LocaleText;
    backToTopLabel: LocaleText;
    imageSrc?: string;
    imageAlt: LocaleText;
    gallery: {
      src: string;
      alt: LocaleText;
    }[];
  };
  projectsPage: {
    title: LocaleText;
    copy: LocaleText;
    filterAllLabel: LocaleText;
    emptyState: LocaleText;
    cardCta: LocaleText;
    ctaTitle: LocaleText;
    ctaDescription: LocaleText;
    ctaAction: LocaleText;
  };
  bioPage: {
    title: LocaleText;
    pending: LocaleText;
    cvLabel: LocaleText;
  };
  eventsPage: {
    title: LocaleText;
    introduction: LocaleText;
    upcomingTitle: LocaleText;
    pastTitle: LocaleText;
    emptyUpcoming: LocaleText;
    emptyPast: LocaleText;
    detailsLabel: LocaleText;
  };
  publicationsPage: {
    title: LocaleText;
    introduction: LocaleText;
    empty: LocaleText;
    openLabel: LocaleText;
    downloadLabel: LocaleText;
  };
  clientsPage: {
    title: LocaleText;
    copy: LocaleText;
    imageSrc?: string;
    imageAlt: LocaleText;
    websiteLabel: LocaleText;
  };
  contact: {
    title: LocaleText;
    copy: LocaleText;
    email: string;
    preparation: LocaleText[];
    bookCallTitle: LocaleText;
    bookCallCopy: LocaleText;
    bookCallCta: LocaleText;
    preparationTitle: LocaleText;
    formTitle: LocaleText;
    formSubtitle: LocaleText;
    successLabel: LocaleText;
    nameLabel: LocaleText;
    emailLabel: LocaleText;
    organizationLabel: LocaleText;
    phoneLabel: LocaleText;
    subjectLabel: LocaleText;
    messageLabel: LocaleText;
    submitLabel: LocaleText;
    sendingLabel: LocaleText;
    moreContactTitle: LocaleText;
    moreContactLabel: LocaleText;
    moreContactNote: LocaleText;
    imageSrc?: string;
    imageAlt: LocaleText;
  };
  footer: {
    tagline: LocaleText;
    adminLabel: LocaleText;
    instagramLabel: LocaleText;
    instagramUrl?: string;
    facebookLabel: LocaleText;
    facebookUrl?: string;
    linkedinLabel: LocaleText;
    linkedinUrl?: string;
  };
  services: Service[];
};

export type SiteContent = SiteCopy & {
  updatedAt?: string;
};
