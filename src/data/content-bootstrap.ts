export const mergeFallbackRecordsUntilInitialized = <T extends { slug: string }>(
  fallbackRecords: T[],
  storedRecords: T[],
  initialized: boolean,
): T[] => {
  if (initialized) {
    return storedRecords;
  }

  const recordsBySlug = new Map(fallbackRecords.map((record) => [record.slug, record]));

  for (const record of storedRecords) {
    recordsBySlug.set(record.slug, record);
  }

  return Array.from(recordsBySlug.values());
};
