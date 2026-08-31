import { env } from "@/lib/env";

type MongoFindCursor<T> = {
  sort(sort: Record<string, number>): MongoFindCursor<T>;
  toArray(): Promise<T[]>;
};

export type MongoCollection<T> = {
  find(query?: Record<string, unknown>, options?: Record<string, unknown>): MongoFindCursor<T>;
  findOne(query: Record<string, unknown>, options?: Record<string, unknown>): Promise<T | null>;
  updateOne(
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
    options?: Record<string, unknown>,
  ): Promise<unknown>;
  deleteOne(filter: Record<string, unknown>): Promise<{ deletedCount?: number }>;
  createIndex(keys: Record<string, number>, options?: Record<string, unknown>): Promise<unknown>;
  countDocuments(query?: Record<string, unknown>): Promise<number>;
};

export type MongoDatabase = {
  collection<T = unknown>(name: string): MongoCollection<T>;
};

type MongoClientInstance = {
  connect(): Promise<MongoClientInstance>;
  close(): Promise<void>;
  db(name?: string): MongoDatabase;
};

type MongoModule = {
  MongoClient: new (uri: string, options?: Record<string, unknown>) => MongoClientInstance;
};

let mongoModule: MongoModule | null | undefined;
let mongoModulePromise: Promise<MongoModule | null> | null = null;
let mongoClientPromise: Promise<MongoClientInstance> | null = null;
let warnedMissingDriver = false;
let warnedConnectionFailure = false;
let activeMongoUri: string | null = null;
let parsedDatabaseName: string | null | undefined;
let mongoRetryAfter = 0;

const MONGO_RETRY_COOLDOWN_MS = 5_000;
const MONGO_SERVER_SELECTION_TIMEOUT_MS = 5_000;
const MONGO_CONNECT_RETRY_DELAY_MS = 250;
const MONGO_CONNECT_ATTEMPTS = 2;

export class MongoDatabaseUnavailableError extends Error {
  readonly name = "MongoDatabaseUnavailableError";
}

const getDatabaseFromUri = (): string | null => {
  if (parsedDatabaseName !== undefined) {
    return parsedDatabaseName;
  }

  try {
    const parsed = new URL(env.mongodbUri);
    const name = parsed.pathname.replace(/^\//, "").split("?")[0];

    parsedDatabaseName = name.length > 0 ? name : null;
  } catch {
    parsedDatabaseName = null;
  }

  return parsedDatabaseName;
};

const describeUri = (uri: string): string => {
  try {
    const parsed = new URL(uri);
    return `${parsed.protocol}//${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}${parsed.pathname}`;
  } catch {
    return uri;
  }
};

const buildSrvFallbackUri = (uri: string): string | null => {
  if (!uri.startsWith("mongodb+srv://")) {
    return null;
  }

  try {
    const fallbackUri = uri.replace("mongodb+srv://", "mongodb://");
    const parsed = new URL(fallbackUri);

    if (!parsed.searchParams.has("directConnection")) {
      parsed.searchParams.set("directConnection", "true");
    }

    if (!parsed.searchParams.has("tls")) {
      parsed.searchParams.set("tls", "true");
    }

    return parsed.toString();
  } catch (error) {
    console.warn("[MongoDB] No fue posible preparar el URI alterno:", error);
    return null;
  }
};

const srvFallbackUri = buildSrvFallbackUri(env.mongodbUri);

const isTransientConnectionError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  const normalized = error.message.toLowerCase();
  return [
    "server selection",
    "timed out",
    "timeout",
    "querysrv",
    "enodata",
    "erefused",
    "enotfound",
    "econnreset",
  ].some((fragment) => normalized.includes(fragment));
};

const shouldRetryWithSrvFallback = (error: unknown): boolean => {
  if (!(error instanceof Error) || typeof error.message !== "string") {
    return false;
  }

  const normalized = error.message.toLowerCase();
  return (
    normalized.includes("querysrv") ||
    normalized.includes("enodata") ||
    normalized.includes("erefused") ||
    normalized.includes("enotfound")
  );
};

const wait = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const connectWithUri = async (mongodb: MongoModule, uri: string): Promise<MongoClientInstance> => {
  const clientInstance = new mongodb.MongoClient(uri, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: MONGO_SERVER_SELECTION_TIMEOUT_MS,
    connectTimeoutMS: MONGO_SERVER_SELECTION_TIMEOUT_MS,
    maxIdleTimeMS: 60_000,
  });

  console.info(`[MongoDB] Intentando conectar a ${describeUri(uri)}`);

  try {
    const connectedClient = await clientInstance.connect();
    activeMongoUri = uri;
    mongoRetryAfter = 0;
    warnedConnectionFailure = false;
    console.info(`[MongoDB] Conexión establecida con ${describeUri(uri)}`);
    return connectedClient;
  } catch (error) {
    await clientInstance.close().catch(() => undefined);
    throw error;
  }
};

const connectWithRetry = async (
  mongodb: MongoModule,
  uri: string,
): Promise<MongoClientInstance> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MONGO_CONNECT_ATTEMPTS; attempt += 1) {
    try {
      return await connectWithUri(mongodb, uri);
    } catch (error) {
      lastError = error;

      if (attempt === MONGO_CONNECT_ATTEMPTS || !isTransientConnectionError(error)) {
        throw error;
      }

      console.warn(`[MongoDB] Conexión transitoria fallida; reintento ${attempt + 1}.`);
      await wait(MONGO_CONNECT_RETRY_DELAY_MS);
    }
  }

  throw lastError;
};

const loadMongoModule = async (): Promise<MongoModule | null> => {
  if (mongoModule !== undefined) {
    return mongoModule;
  }

  if (!mongoModulePromise) {
    mongoModulePromise = import("mongodb")
      .then((module) => {
        mongoModule = module as MongoModule;
        return mongoModule;
      })
      .catch((error) => {
        mongoModule = null;

        if (!warnedMissingDriver) {
          warnedMissingDriver = true;
          const errorMessage =
            error instanceof Error ? error.message : "Unknown MongoDB driver load error";
          console.warn(
            `MongoDB driver failed to load. Install it with \`npm install mongodb\` to enable database features. Error: ${errorMessage}`,
          );
        }

        return null;
      })
      .finally(() => {
        mongoModulePromise = null;
      });
  }

  return mongoModulePromise;
};

export const getMongoClient = async (): Promise<MongoClientInstance | null> => {
  if (!env.mongodbUri) {
    return null;
  }

  if (!mongoClientPromise && Date.now() < mongoRetryAfter) {
    return null;
  }

  const mongodb = await loadMongoModule();

  if (!mongodb) {
    return null;
  }

  if (!mongoClientPromise) {
    const initialUri = activeMongoUri ?? env.mongodbUri;
    mongoClientPromise = connectWithRetry(mongodb, initialUri).catch(async (error) => {
      if (
        srvFallbackUri &&
        initialUri === env.mongodbUri &&
        shouldRetryWithSrvFallback(error)
      ) {
        console.warn(
          "[MongoDB] Error al resolver el registro SRV. Reintentando con conexión directa...",
        );
        return connectWithRetry(mongodb, srvFallbackUri);
      }

      throw error;
    });
  }

  try {
    const client = await mongoClientPromise;
    return client;
  } catch (error) {
    activeMongoUri = null;
    mongoClientPromise = null;
    mongoRetryAfter = Date.now() + MONGO_RETRY_COOLDOWN_MS;
    if (!warnedConnectionFailure) {
      warnedConnectionFailure = true;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown MongoDB connection error";
      console.error(
        `MongoDB connection failed (${describeUri(env.mongodbUri)}). Cached readers will preserve the last valid content. Error: ${errorMessage}`,
      );
    }

    return null;
  }
};

export const getMongoDatabase = async (): Promise<MongoDatabase | null> => {
  const client = await getMongoClient();

  if (!client) {
    return null;
  }

  const databaseName = env.mongodbDb || getDatabaseFromUri() || undefined;
  return client.db(databaseName);
};

/**
 * Public content reads must distinguish an unavailable database from a valid
 * empty result. Throwing here prevents Next.js from caching local fallback
 * content as if it had come from MongoDB.
 */
export const requireMongoDatabase = async (): Promise<MongoDatabase> => {
  const database = await getMongoDatabase();

  if (!database) {
    throw new MongoDatabaseUnavailableError("MongoDB is temporarily unavailable");
  }

  return database;
};
