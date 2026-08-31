import { unstable_cache } from "next/cache";

import { ARTIST_EVENTS, ARTIST_PROFILE, PUBLICATIONS } from "@/content/artist";
import type { ArtistEvent, ArtistProfile, Publication } from "@/domain/artist";
import {
  CONTENT_CACHE_TAGS,
  PUBLIC_CONTENT_REVALIDATE_SECONDS,
} from "@/lib/content-cache";
import { createResilientContentReader } from "@/data/resilient-read";
import { hasDatabaseConfig } from "@/lib/env";
import { fetchArtistEvents, fetchArtistProfile, fetchPublications } from "@/server/artist";

const getArtistProfileFromDatabase = async (): Promise<ArtistProfile> => {
  return (await fetchArtistProfile()) ?? ARTIST_PROFILE;
};

const getArtistProfileCached = unstable_cache(
  getArtistProfileFromDatabase,
  ["public-artist-profile-v2"],
  {
    revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
    tags: [CONTENT_CACHE_TAGS.artist],
  },
);

const readArtistProfile = createResilientContentReader(
  "artist-profile",
  () => ARTIST_PROFILE,
);

export const getArtistProfile = async (): Promise<ArtistProfile> => {
  if (!hasDatabaseConfig()) {
    return ARTIST_PROFILE;
  }

  return readArtistProfile(getArtistProfileCached);
};

const sortArtistEvents = (events: ArtistEvent[], includePrivate: boolean): ArtistEvent[] =>
  [...events]
    .filter((event) => includePrivate || !event.isPrivate)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

const getArtistEventsFromDatabase = async (includePrivate = false): Promise<ArtistEvent[]> => {
  const stored = await fetchArtistEvents();
  return sortArtistEvents(stored, includePrivate);
};

const getArtistEventsCached = unstable_cache(
  () => getArtistEventsFromDatabase(false),
  ["public-artist-events-v2"],
  {
    revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
    tags: [CONTENT_CACHE_TAGS.events],
  },
);

const readPublicEvents = createResilientContentReader("artist-events", () =>
  sortArtistEvents(ARTIST_EVENTS, false),
);
const readAllEvents = createResilientContentReader("artist-events:admin", () =>
  sortArtistEvents(ARTIST_EVENTS, true),
);

export const getArtistEvents = async (includePrivate = false): Promise<ArtistEvent[]> => {
  if (!hasDatabaseConfig()) {
    return sortArtistEvents(ARTIST_EVENTS, includePrivate);
  }

  return includePrivate
    ? readAllEvents(() => getArtistEventsFromDatabase(true))
    : readPublicEvents(getArtistEventsCached);
};

const sortPublications = (publications: Publication[], includePrivate: boolean): Publication[] =>
  [...publications]
    .filter((publication) => includePrivate || !publication.isPrivate)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

const getPublicationsFromDatabase = async (includePrivate = false): Promise<Publication[]> => {
  const stored = await fetchPublications();
  return sortPublications(stored, includePrivate);
};

const getPublicationsCached = unstable_cache(
  () => getPublicationsFromDatabase(false),
  ["public-publications-v3"],
  {
    revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
    tags: [CONTENT_CACHE_TAGS.publications],
  },
);

const readPublications = createResilientContentReader("publications", () =>
  sortPublications(PUBLICATIONS, false),
);
const readAllPublications = createResilientContentReader("publications:admin", () =>
  sortPublications(PUBLICATIONS, true),
);

export const getPublications = async (includePrivate = false): Promise<Publication[]> => {
  if (!hasDatabaseConfig()) {
    return sortPublications(PUBLICATIONS, includePrivate);
  }

  return includePrivate
    ? readAllPublications(() => getPublicationsFromDatabase(true))
    : readPublications(getPublicationsCached);
};
