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
};

export type MongoDatabase = {
  collection<T = unknown>(name: string): MongoCollection<T>;
};

type MongoClientInstance = {
  connect(): Promise<MongoClientInstance>;
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

const connectWithUri = async (mongodb: MongoModule, uri: string): Promise<MongoClientInstance> => {
  const clientInstance = new mongodb.MongoClient(uri, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
  });

  console.info(`[MongoDB] Intentando conectar a ${describeUri(uri)}`);

  const connectedClient = await clientInstance.connect();
  activeMongoUri = uri;
  warnedConnectionFailure = false;
  return connectedClient;
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

  const mongodb = await loadMongoModule();

  if (!mongodb) {
    return null;
  }

  if (!mongoClientPromise) {
    const initialUri = activeMongoUri ?? env.mongodbUri;
    mongoClientPromise = connectWithUri(mongodb, initialUri).catch(async (error) => {
      if (
        srvFallbackUri &&
        initialUri === env.mongodbUri &&
        shouldRetryWithSrvFallback(error)
      ) {
        console.warn(
          "[MongoDB] Error al resolver el registro SRV. Reintentando con conexión directa...",
        );
        return connectWithUri(mongodb, srvFallbackUri);
      }

      throw error;
    });
  }

  try {
    const client = await mongoClientPromise;
    return client;
  } catch (error) {
    mongoClientPromise = null;
    if (!warnedConnectionFailure) {
      warnedConnectionFailure = true;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown MongoDB connection error";
      console.error(
        `Failed to connect to MongoDB (${describeUri(env.mongodbUri)}). Falling back to Markdown content. Error: ${errorMessage}`,
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
