import { createHash } from "node:crypto";

import { env, hasCloudinaryConfig } from "@/lib/env";

export type UploadSignatureOptions = {
  folder?: string;
  eager?: string;
  publicId?: string;
};

export type UploadSignature = {
  uploadUrl: string;
  apiKey: string;
  cloudName: string;
  signature: string;
  timestamp: number;
  folder?: string;
  eager?: string;
  publicId?: string;
};

const createStringToSign = (params: Record<string, string>): string => {
  const entries = Object.entries(params)
    .filter(([, value]) => value.length > 0)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

  return entries.map(([key, value]) => `${key}=${value}`).join("&");
};

export const createUploadSignature = (
  options: UploadSignatureOptions = {},
): UploadSignature | null => {
  if (!hasCloudinaryConfig()) {
    return null;
  }

  const timestamp = Math.floor(Date.now() / 1000);

  const params: Record<string, string> = {
    timestamp: String(timestamp),
  };

  if (options.folder) {
    params.folder = options.folder;
  }

  if (options.eager) {
    params.eager = options.eager;
  }

  if (options.publicId) {
    params.public_id = options.publicId;
  }

  const stringToSign = createStringToSign(params);
  const signature = createHash("sha1")
    .update(`${stringToSign}${env.cloudinaryApiSecret}`)
    .digest("hex");

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.cloudinaryCloudName}/auto/upload`,
    apiKey: env.cloudinaryApiKey,
    cloudName: env.cloudinaryCloudName,
    signature,
    timestamp,
    folder: options.folder,
    eager: options.eager,
    publicId: options.publicId,
  };
};

type CloudinaryApiError = { error?: { message?: string } | string };

type CloudinaryResource = {
  asset_id?: string;
  public_id: string;
  secure_url?: string;
  url?: string;
  folder?: string;
  bytes?: number;
  width?: number;
  height?: number;
  format?: string;
  created_at?: string;
};

type CloudinaryResourcesResponse = CloudinaryApiError & {
  resources?: CloudinaryResource[];
  next_cursor?: string;
};

export const buildCloudinaryImageUrl = (
  publicId: string,
  options: { transformation?: string } = {},
): string | null => {
  if (!env.cloudinaryCloudName) {
    return null;
  }

  const transformation = options.transformation ? `${options.transformation}/` : "";
  return `https://res.cloudinary.com/${env.cloudinaryCloudName}/image/upload/${transformation}${publicId}`;
};

export const buildCloudinaryVideoUrl = (
  publicId: string,
  options: { transformation?: string } = {},
): string | null => {
  if (!env.cloudinaryCloudName) {
    return null;
  }

  const transformation = options.transformation ? `${options.transformation}/` : "";
  return `https://res.cloudinary.com/${env.cloudinaryCloudName}/video/upload/${transformation}${publicId}`;
};

export type CloudinaryLibraryAsset = {
  id: string;
  publicId: string;
  folder: string;
  url: string;
  thumbnailUrl: string;
  bytes: number;
  width: number;
  height: number;
  format: string;
  createdAt: string;
};

export type CloudinaryLibraryResult = {
  assets: CloudinaryLibraryAsset[];
  nextCursor: string | null;
};

const normalizeFolder = (folder?: string): string | undefined => {
  if (!folder) {
    return undefined;
  }

  const trimmed = folder.trim();

  if (!trimmed) {
    return undefined;
  }

  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
};

export const fetchCloudinaryLibrary = async (
  options: { folder?: string; nextCursor?: string; maxResults?: number } = {},
): Promise<CloudinaryLibraryResult> => {
  if (!hasCloudinaryConfig()) {
    throw new Error("Cloudinary credentials are not configured.");
  }

  const params = new URLSearchParams();
  const maxResults = Math.max(1, Math.min(options.maxResults ?? 30, 100));
  params.set("max_results", String(maxResults));
  params.set("type", "upload");

  if (options.nextCursor) {
    params.set("next_cursor", options.nextCursor);
  }

  const normalizedFolder = normalizeFolder(options.folder);

  if (normalizedFolder) {
    params.set("prefix", normalizedFolder);
  }

  const apiUrl = `https://api.cloudinary.com/v1_1/${env.cloudinaryCloudName}/resources/image/upload?${params.toString()}`;
  const credentials = Buffer.from(`${env.cloudinaryApiKey}:${env.cloudinaryApiSecret}`).toString("base64");

  const response = await fetch(apiUrl, {
    headers: {
      Authorization: `Basic ${credentials}`,
    },
    cache: "no-store",
  });

  const payloadText = await response.text();
  let payload: CloudinaryResourcesResponse | null = null;

  if (payloadText.length > 0) {
    try {
      payload = JSON.parse(payloadText) as CloudinaryResourcesResponse;
    } catch {
      payload = null;
    }
  }

  if (!response.ok || !payload?.resources) {
    const message =
      (typeof payload?.error === "string" && payload.error.length > 0
        ? payload.error
        : typeof payload?.error === "object" && payload.error?.message
          ? payload.error.message
          : null) ?? "No fue posible cargar la biblioteca de Cloudinary";

    throw new Error(message);
  }

  return {
    assets: payload.resources.map((resource) => {
      const defaultUrl = buildCloudinaryImageUrl(resource.public_id) ?? resource.secure_url ?? resource.url ?? "";
      const thumbnailUrl =
        buildCloudinaryImageUrl(resource.public_id, { transformation: "c_fill,w_320,h_320,g_auto" }) ??
        resource.secure_url ??
        resource.url ??
        defaultUrl;

      return {
        id: resource.asset_id ?? resource.public_id,
        publicId: resource.public_id,
        folder: resource.folder ?? "",
        url: defaultUrl,
        thumbnailUrl,
        bytes: resource.bytes ?? 0,
        width: resource.width ?? 0,
        height: resource.height ?? 0,
        format: resource.format ?? "",
        createdAt: resource.created_at ?? "",
      } satisfies CloudinaryLibraryAsset;
    }),
    nextCursor: payload.next_cursor ?? null,
  } satisfies CloudinaryLibraryResult;
};
