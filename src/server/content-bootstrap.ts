import type { MongoDatabase } from "@/server/mongodb";

const STATE_COLLECTION = "contentInitialization";
const initializationTasks = new Map<string, Promise<boolean>>();

type ContentInitializationMarker = {
  _id: string;
  initializedAt?: Date;
};

export const isContentCollectionInitialized = async (
  db: MongoDatabase,
  key: string,
): Promise<boolean> => {
  const marker = await db
    .collection<ContentInitializationMarker>(STATE_COLLECTION)
    .findOne({ _id: key });

  return Boolean(marker);
};

export const ensureContentCollectionInitialized = async ({
  db,
  key,
  seed,
}: {
  db: MongoDatabase;
  key: string;
  seed: () => Promise<void>;
}): Promise<boolean> => {
  const pendingTask = initializationTasks.get(key);

  if (pendingTask) {
    return pendingTask;
  }

  const initializationTask = (async () => {
    if (await isContentCollectionInitialized(db, key)) {
      return false;
    }

    await seed();
    await db.collection<ContentInitializationMarker>(STATE_COLLECTION).updateOne(
      { _id: key },
      { $setOnInsert: { initializedAt: new Date() } },
      { upsert: true },
    );

    return true;
  })();

  initializationTasks.set(key, initializationTask);

  try {
    return await initializationTask;
  } finally {
    if (initializationTasks.get(key) === initializationTask) {
      initializationTasks.delete(key);
    }
  }
};
