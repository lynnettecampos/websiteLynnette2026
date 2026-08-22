const normalize = (value: string | undefined): string => value?.trim() ?? "";

const normalizeWithFallback = (value: string | undefined, fallback: string): string => {
  const normalized = normalize(value);
  return normalized.length > 0 ? normalized : fallback;
};

export const env = {
  mongodbUri: normalize(process.env.MONGODB_URI),
  mongodbDb: normalize(process.env.MONGODB_DB),
  mongodbClientsCollection: normalizeWithFallback(process.env.MONGODB_CLIENTS_COLLECTION, "clients"),
  cloudinaryCloudName: normalize(process.env.CLOUDINARY_CLOUD_NAME),
  cloudinaryApiKey: normalize(process.env.CLOUDINARY_API_KEY),
  cloudinaryApiSecret: normalize(process.env.CLOUDINARY_API_SECRET),
  adminEmail: normalize(process.env.ADMIN_EMAIL).toLowerCase(),
  adminPassword: normalize(process.env.ADMIN_PASSWORD),
  adminSessionSecret: normalize(process.env.ADMIN_SESSION_SECRET),
};

export const hasDatabaseConfig = (): boolean => env.mongodbUri.length > 0;

export const hasCloudinaryConfig = (): boolean =>
  env.cloudinaryCloudName.length > 0 &&
  env.cloudinaryApiKey.length > 0 &&
  env.cloudinaryApiSecret.length > 0;

export const ADMIN_SESSION_COOKIE = "mmk_admin_session";

export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
