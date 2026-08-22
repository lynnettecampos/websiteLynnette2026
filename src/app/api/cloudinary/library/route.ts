import { NextResponse } from "next/server";

import { hasCloudinaryConfig } from "@/lib/env";
import { verifyRequestSession } from "@/server/auth";
import { fetchCloudinaryLibrary } from "@/server/cloudinary";

export async function GET(request: Request) {
  const session = verifyRequestSession(request.headers.get("cookie") ?? undefined);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasCloudinaryConfig()) {
    return NextResponse.json(
      { error: "Cloudinary credentials are not configured. Set CLOUDINARY_* env vars." },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const folder = searchParams.get("folder")?.trim() ?? undefined;
  const nextCursor = searchParams.get("nextCursor")?.trim() ?? undefined;
  const maxResultsParam = searchParams.get("maxResults");
  const maxResults = maxResultsParam ? Number.parseInt(maxResultsParam, 10) : undefined;

  try {
    const result = await fetchCloudinaryLibrary({ folder, nextCursor, maxResults });
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error
        ? error.message
        : "No fue posible cargar las imágenes disponibles en Cloudinary";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
