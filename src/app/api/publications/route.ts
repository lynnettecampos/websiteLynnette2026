import { NextResponse } from "next/server";

import { getPublications } from "@/data/artist";
import { hasDatabaseConfig } from "@/lib/env";
import { verifyRequestSession } from "@/server/auth";
import { upsertPublication } from "@/server/artist";
import { publicationSchema } from "@/server/validation";

export async function GET(request: Request) {
  const includePrivate = Boolean(
    verifyRequestSession(request.headers.get("cookie") ?? undefined),
  );

  return NextResponse.json(await getPublications(includePrivate));
}

export async function POST(request: Request) {
  if (!hasDatabaseConfig()) return NextResponse.json({ error: "Database is not configured" }, { status: 500 });
  if (!verifyRequestSession(request.headers.get("cookie") ?? undefined)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = await request.json().catch(() => null);
  const parsed = publicationSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const existingPublications = await getPublications(true);
  if (existingPublications.some((publication) => publication.slug === parsed.data.slug)) {
    return NextResponse.json(
      { error: "Ya existe una publicación con ese slug." },
      { status: 409 },
    );
  }
  const publication = await upsertPublication(parsed.data);
  return publication
    ? NextResponse.json(publication)
    : NextResponse.json({ error: "Failed to save publication" }, { status: 500 });
}
