import { NextResponse } from "next/server";

import { getArtistProfile } from "@/data/artist";
import { CONTENT_CACHE_TAGS, invalidatePublicContent } from "@/lib/content-cache";
import { hasDatabaseConfig } from "@/lib/env";
import { verifyRequestSession } from "@/server/auth";
import { upsertArtistProfile } from "@/server/artist";
import { artistProfileSchema } from "@/server/validation";

export async function GET() {
  return NextResponse.json(await getArtistProfile());
}

export async function PUT(request: Request) {
  if (!hasDatabaseConfig()) return NextResponse.json({ error: "Database is not configured" }, { status: 500 });
  if (!verifyRequestSession(request.headers.get("cookie") ?? undefined)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = await request.json().catch(() => null);
  const parsed = artistProfileSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const profile = await upsertArtistProfile(parsed.data);
  if (profile) invalidatePublicContent(CONTENT_CACHE_TAGS.artist);
  return profile
    ? NextResponse.json(profile)
    : NextResponse.json({ error: "Failed to save artist profile" }, { status: 500 });
}
