import { DEFAULT_SITE_CONTENT } from "@/content/site";
import type { SiteContent } from "@/domain/site";
import { hasDatabaseConfig } from "@/lib/env";
import { fetchSiteContent } from "@/server/site";

const mergeSiteContent = (fetched: SiteContent | null): SiteContent => {
  if (!fetched) {
    return DEFAULT_SITE_CONTENT;
  }

  const mergedServices = (fetched.services ?? DEFAULT_SITE_CONTENT.services).map((service) => {
    const fallback = DEFAULT_SITE_CONTENT.services.find((item) => item.slug === service.slug);

    return {
      ...fallback,
      ...service,
      gallery: service.gallery && service.gallery.length > 0 ? service.gallery : fallback?.gallery ?? [],
    };
  });

  return {
    ...DEFAULT_SITE_CONTENT,
    ...fetched,
    navigation: {
      ...DEFAULT_SITE_CONTENT.navigation,
      ...(fetched.navigation ?? {}),
    },
    bioPage: {
      ...DEFAULT_SITE_CONTENT.bioPage,
      ...(fetched.bioPage ?? {}),
    },
    eventsPage: {
      ...DEFAULT_SITE_CONTENT.eventsPage,
      ...(fetched.eventsPage ?? {}),
    },
    publicationsPage: {
      ...DEFAULT_SITE_CONTENT.publicationsPage,
      ...(fetched.publicationsPage ?? {}),
    },
    projectsPage: {
      ...DEFAULT_SITE_CONTENT.projectsPage,
      ...(fetched.projectsPage ?? {}),
    },
    contact: {
      ...DEFAULT_SITE_CONTENT.contact,
      ...(fetched.contact ?? {}),
    },
    services: mergedServices,
  };
};

export const getSiteContent = async (): Promise<SiteContent> => {
  if (!hasDatabaseConfig()) {
    return DEFAULT_SITE_CONTENT;
  }

  const site = await fetchSiteContent();
  return mergeSiteContent(site);
};
