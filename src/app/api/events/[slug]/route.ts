import { NextResponse } from "next/server";

import { CONTENT_CACHE_TAGS, invalidatePublicContent } from "@/lib/content-cache";
import { hasDatabaseConfig } from "@/lib/env";
import { verifyRequestSession } from "@/server/auth";
import { deleteArtistEvent, upsertArtistEvent } from "@/server/artist";
import { artistEventSchema } from "@/server/validation";

type RouteContext = { params: Promise<{ slug: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  if (!hasDatabaseConfig()) return NextResponse.json({ error: "Database is not configured" }, { status: 500 });
  if (!verifyRequestSession(request.headers.get("cookie") ?? undefined)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await context.params;
  const payload = await request.json().catch(() => null);
  const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const parsed = artistEventSchema.safeParse({ ...record, slug });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const event = await upsertArtistEvent(parsed.data);
  if (event) invalidatePublicContent(CONTENT_CACHE_TAGS.events);
  return event
    ? NextResponse.json(event)
    : NextResponse.json({ error: "Failed to save event" }, { status: 500 });
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!hasDatabaseConfig()) return NextResponse.json({ error: "Database is not configured" }, { status: 500 });
  if (!verifyRequestSession(request.headers.get("cookie") ?? undefined)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await context.params;
  const deleted = await deleteArtistEvent(slug);
  if (!deleted) {
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
  invalidatePublicContent(CONTENT_CACHE_TAGS.events);
  return NextResponse.json({ success: true });
}
