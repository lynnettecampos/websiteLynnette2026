import { NextResponse } from "next/server";

import { CONTENT_CACHE_TAGS, invalidatePublicContent } from "@/lib/content-cache";
import { hasDatabaseConfig } from "@/lib/env";
import { verifyRequestSession } from "@/server/auth";
import { deletePublication, upsertPublication } from "@/server/artist";
import { publicationSchema } from "@/server/validation";

type RouteContext = { params: Promise<{ slug: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  if (!hasDatabaseConfig()) return NextResponse.json({ error: "Database is not configured" }, { status: 500 });
  if (!verifyRequestSession(request.headers.get("cookie") ?? undefined)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await context.params;
  const payload = await request.json().catch(() => null);
  const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const parsed = publicationSchema.safeParse({ ...record, slug });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const publication = await upsertPublication(parsed.data);
  if (publication) invalidatePublicContent(CONTENT_CACHE_TAGS.publications);
  return publication
    ? NextResponse.json(publication)
    : NextResponse.json({ error: "Failed to save publication" }, { status: 500 });
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!hasDatabaseConfig()) return NextResponse.json({ error: "Database is not configured" }, { status: 500 });
  if (!verifyRequestSession(request.headers.get("cookie") ?? undefined)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await context.params;
  const deleted = await deletePublication(slug);
  if (!deleted) {
    return NextResponse.json({ error: "Failed to delete publication" }, { status: 500 });
  }
  invalidatePublicContent(CONTENT_CACHE_TAGS.publications);
  return NextResponse.json({ success: true });
}
