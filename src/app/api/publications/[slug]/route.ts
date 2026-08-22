import { NextResponse } from "next/server";

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
  return (await deletePublication(slug))
    ? NextResponse.json({ success: true })
    : NextResponse.json({ error: "Failed to delete publication" }, { status: 500 });
}
