import { unstable_cache } from "next/cache";

import { ARTIST_EVENTS, ARTIST_PROFILE, PUBLICATIONS } from "@/content/artist";
import type { ArtistEvent, ArtistProfile, Publication } from "@/domain/artist";
import {
  CONTENT_CACHE_TAGS,
  PUBLIC_CONTENT_REVALIDATE_SECONDS,
} from "@/lib/content-cache";
import { hasDatabaseConfig } from "@/lib/env";
import { fetchArtistEvents, fetchArtistProfile, fetchPublications } from "@/server/artist";

const getArtistProfileUncached = async (): Promise<ArtistProfile> => {
  if (!hasDatabaseConfig()) return ARTIST_PROFILE;
  return (await fetchArtistProfile()) ?? ARTIST_PROFILE;
};

const getArtistProfileCached = unstable_cache(
  getArtistProfileUncached,
  ["public-artist-profile-v1"],
  {
    revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
    tags: [CONTENT_CACHE_TAGS.artist],
  },
);

export const getArtistProfile = async (): Promise<ArtistProfile> =>
  getArtistProfileCached();

const getArtistEventsUncached = async (includePrivate = false): Promise<ArtistEvent[]> => {
  const stored = hasDatabaseConfig() ? await fetchArtistEvents() : null;
  const events = stored && stored.length > 0 ? stored : ARTIST_EVENTS;
  return events
    .filter((event) => includePrivate || !event.isPrivate)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
};

const getArtistEventsCached = unstable_cache(
  () => getArtistEventsUncached(false),
  ["public-artist-events-v1"],
  {
    revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
    tags: [CONTENT_CACHE_TAGS.events],
  },
);

export const getArtistEvents = async (includePrivate = false): Promise<ArtistEvent[]> =>
  includePrivate ? getArtistEventsUncached(true) : getArtistEventsCached();

const getPublicationsUncached = async (includePrivate = false): Promise<Publication[]> => {
  const stored = hasDatabaseConfig() ? await fetchPublications() : null;
  const publications = stored && stored.length > 0 ? stored : PUBLICATIONS;
  return publications
    .filter((publication) => includePrivate || !publication.isPrivate)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
};

const getPublicationsCached = unstable_cache(
  () => getPublicationsUncached(false),
  ["public-publications-v2"],
  {
    revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
    tags: [CONTENT_CACHE_TAGS.publications],
  },
);

export const getPublications = async (includePrivate = false): Promise<Publication[]> =>
  includePrivate ? getPublicationsUncached(true) : getPublicationsCached();
