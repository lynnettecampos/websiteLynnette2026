import type { ArtistEvent, ArtistProfile, Publication } from "@/domain/artist";
import { getMongoDatabase } from "@/server/mongodb";

const PROFILE_COLLECTION = "artistProfile";
const PROFILE_ID = "global";
const EVENTS_COLLECTION = "artistEvents";
const PUBLICATIONS_COLLECTION = "publications";

type StoredProfile = ArtistProfile & { _id: string; updatedAt?: Date };
type StoredEvent = ArtistEvent & { createdAt?: Date; updatedAt?: Date };
type StoredPublication = Publication & { createdAt?: Date; updatedAt?: Date };

export const fetchArtistProfile = async (): Promise<ArtistProfile | null> => {
  const db = await getMongoDatabase();
  if (!db) return null;
  const document = await db.collection<StoredProfile>(PROFILE_COLLECTION).findOne({ _id: PROFILE_ID });
  if (!document) return null;
  return {
    name: document.name,
    role: document.role,
    introduction: document.introduction,
    biography: document.biography,
    statementTitle: document.statementTitle,
    statement: document.statement,
    portrait: document.portrait,
    cvUrl: document.cvUrl,
  };
};

export const upsertArtistProfile = async (profile: ArtistProfile): Promise<ArtistProfile | null> => {
  const db = await getMongoDatabase();
  if (!db) return null;
  const { portrait, cvUrl, ...requiredProfile } = profile;
  const fieldsToUnset = {
    ...(portrait === undefined ? { portrait: "" } : {}),
    ...(cvUrl === undefined ? { cvUrl: "" } : {}),
  };

  // Profile writes are full replacements validated by artistProfileSchema. An
  // omitted optional field therefore means that the editor intentionally
  // cleared it, rather than that MongoDB should preserve its previous value.
  await db.collection<StoredProfile>(PROFILE_COLLECTION).updateOne(
    { _id: PROFILE_ID },
    {
      $set: {
        ...requiredProfile,
        ...(portrait !== undefined ? { portrait } : {}),
        ...(cvUrl !== undefined ? { cvUrl } : {}),
        updatedAt: new Date(),
      },
      ...(Object.keys(fieldsToUnset).length > 0 ? { $unset: fieldsToUnset } : {}),
    },
    { upsert: true },
  );
  return fetchArtistProfile();
};

export const fetchArtistEvents = async (): Promise<ArtistEvent[] | null> => {
  const db = await getMongoDatabase();
  if (!db) return null;
  const documents = await db.collection<StoredEvent>(EVENTS_COLLECTION).find({}, { projection: { _id: 0, createdAt: 0, updatedAt: 0 } }).toArray();
  return documents as ArtistEvent[];
};

export const upsertArtistEvent = async (event: ArtistEvent): Promise<ArtistEvent | null> => {
  const db = await getMongoDatabase();
  if (!db) return null;
  const {
    endDate,
    description,
    url,
    image,
    projectSlug,
    isPrivate,
    ...requiredEvent
  } = event;
  const fieldsToUnset = {
    ...(endDate === undefined ? { endDate: "" } : {}),
    ...(description === undefined ? { description: "" } : {}),
    ...(url === undefined ? { url: "" } : {}),
    ...(image === undefined ? { image: "" } : {}),
    ...(projectSlug === undefined ? { projectSlug: "" } : {}),
    ...(isPrivate === undefined ? { isPrivate: "" } : {}),
  };

  await db.collection<StoredEvent>(EVENTS_COLLECTION).updateOne(
    { slug: event.slug },
    {
      $set: {
        ...requiredEvent,
        ...(endDate !== undefined ? { endDate } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(url !== undefined ? { url } : {}),
        ...(image !== undefined ? { image } : {}),
        ...(projectSlug !== undefined ? { projectSlug } : {}),
        ...(isPrivate !== undefined ? { isPrivate } : {}),
        updatedAt: new Date(),
      },
      ...(Object.keys(fieldsToUnset).length > 0 ? { $unset: fieldsToUnset } : {}),
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  );
  const stored = await db.collection<StoredEvent>(EVENTS_COLLECTION).findOne({ slug: event.slug }, { projection: { _id: 0, createdAt: 0, updatedAt: 0 } });
  return stored as ArtistEvent | null;
};

export const deleteArtistEvent = async (slug: string): Promise<boolean> => {
  const db = await getMongoDatabase();
  if (!db) return false;
  const result = await db.collection<StoredEvent>(EVENTS_COLLECTION).deleteOne({ slug });
  return (result.deletedCount ?? 0) > 0;
};

export const fetchPublications = async (): Promise<Publication[] | null> => {
  const db = await getMongoDatabase();
  if (!db) return null;
  const documents = await db.collection<StoredPublication>(PUBLICATIONS_COLLECTION).find({}, { projection: { _id: 0, createdAt: 0, updatedAt: 0 } }).toArray();
  return documents as Publication[];
};

export const upsertPublication = async (publication: Publication): Promise<Publication | null> => {
  const db = await getMongoDatabase();
  if (!db) return null;
  const {
    summary,
    url,
    downloadUrl,
    pdfPublicId,
    projectSlug,
    cover,
    isPrivate,
    ...requiredPublication
  } = publication;
  const fieldsToUnset = {
    ...(summary === undefined ? { summary: "" } : {}),
    ...(url === undefined ? { url: "" } : {}),
    ...(downloadUrl === undefined ? { downloadUrl: "" } : {}),
    ...(pdfPublicId === undefined ? { pdfPublicId: "" } : {}),
    ...(projectSlug === undefined ? { projectSlug: "" } : {}),
    ...(cover === undefined ? { cover: "" } : {}),
    ...(isPrivate === undefined ? { isPrivate: "" } : {}),
  };

  await db.collection<StoredPublication>(PUBLICATIONS_COLLECTION).updateOne(
    { slug: publication.slug },
    {
      $set: {
        ...requiredPublication,
        ...(summary !== undefined ? { summary } : {}),
        ...(url !== undefined ? { url } : {}),
        ...(downloadUrl !== undefined ? { downloadUrl } : {}),
        ...(pdfPublicId !== undefined ? { pdfPublicId } : {}),
        ...(projectSlug !== undefined ? { projectSlug } : {}),
        ...(cover !== undefined ? { cover } : {}),
        ...(isPrivate !== undefined ? { isPrivate } : {}),
        updatedAt: new Date(),
      },
      ...(Object.keys(fieldsToUnset).length > 0 ? { $unset: fieldsToUnset } : {}),
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  );
  const stored = await db.collection<StoredPublication>(PUBLICATIONS_COLLECTION).findOne({ slug: publication.slug }, { projection: { _id: 0, createdAt: 0, updatedAt: 0 } });
  return stored as Publication | null;
};

export const deletePublication = async (slug: string): Promise<boolean> => {
  const db = await getMongoDatabase();
  if (!db) return false;
  const result = await db.collection<StoredPublication>(PUBLICATIONS_COLLECTION).deleteOne({ slug });
  return (result.deletedCount ?? 0) > 0;
};
