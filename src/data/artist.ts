import { ARTIST_EVENTS, ARTIST_PROFILE, PUBLICATIONS } from "@/content/artist";
import type { ArtistEvent, ArtistProfile, Publication } from "@/domain/artist";
import { hasDatabaseConfig } from "@/lib/env";
import { fetchArtistEvents, fetchArtistProfile, fetchPublications } from "@/server/artist";

export const getArtistProfile = async (): Promise<ArtistProfile> => {
  if (!hasDatabaseConfig()) return ARTIST_PROFILE;
  return (await fetchArtistProfile()) ?? ARTIST_PROFILE;
};

export const getArtistEvents = async (includePrivate = false): Promise<ArtistEvent[]> => {
  const stored = hasDatabaseConfig() ? await fetchArtistEvents() : null;
  const events = stored && stored.length > 0 ? stored : ARTIST_EVENTS;
  return events
    .filter((event) => includePrivate || !event.isPrivate)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
};

export const getPublications = async (includePrivate = false): Promise<Publication[]> => {
  const stored = hasDatabaseConfig() ? await fetchPublications() : null;
  const publications = stored && stored.length > 0 ? stored : PUBLICATIONS;
  return publications
    .filter((publication) => includePrivate || !publication.isPrivate)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
};
