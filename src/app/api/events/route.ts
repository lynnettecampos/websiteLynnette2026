import { NextResponse } from "next/server";

import { getArtistEvents } from "@/data/artist";
import { CONTENT_CACHE_TAGS, invalidatePublicContent } from "@/lib/content-cache";
import { hasDatabaseConfig } from "@/lib/env";
import { verifyRequestSession } from "@/server/auth";
import { upsertArtistEvent } from "@/server/artist";
import { artistEventSchema } from "@/server/validation";

export async function GET(request: Request) {
  const includePrivate = Boolean(
    verifyRequestSession(request.headers.get("cookie") ?? undefined),
  );

  return NextResponse.json(await getArtistEvents(includePrivate));
}

export async function POST(request: Request) {
  if (!hasDatabaseConfig()) return NextResponse.json({ error: "Database is not configured" }, { status: 500 });
  if (!verifyRequestSession(request.headers.get("cookie") ?? undefined)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = await request.json().catch(() => null);
  const parsed = artistEventSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const existingEvents = await getArtistEvents(true);
  if (existingEvents.some((event) => event.slug === parsed.data.slug)) {
    return NextResponse.json(
      { error: "Ya existe un evento con ese slug." },
      { status: 409 },
    );
  }
  const event = await upsertArtistEvent(parsed.data);
  if (event) invalidatePublicContent(CONTENT_CACHE_TAGS.events);
  return event
    ? NextResponse.json(event)
    : NextResponse.json({ error: "Failed to save event" }, { status: 500 });
}
