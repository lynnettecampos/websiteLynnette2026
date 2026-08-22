import { NextResponse } from "next/server";

import type { SiteContent } from "@/domain/site";
import { hasDatabaseConfig } from "@/lib/env";
import { verifyRequestSession } from "@/server/auth";
import { fetchSiteContent, upsertSiteContent } from "@/server/site";
import { sitePayloadSchema } from "@/server/validation";

export async function GET() {
  const site = await fetchSiteContent();
  return NextResponse.json(site satisfies SiteContent | null);
}

export async function POST(request: Request) {
  if (!hasDatabaseConfig()) {
    return NextResponse.json(
      { error: "Database is not configured. Set MONGODB_URI to enable admin actions." },
      { status: 500 },
    );
  }

  const session = verifyRequestSession(request.headers.get("cookie") ?? undefined);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parseResult = sitePayloadSchema.safeParse(payload);

  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.flatten() }, { status: 400 });
  }

  const site = await upsertSiteContent(parseResult.data);

  if (!site) {
    return NextResponse.json({ error: "Failed to save site content" }, { status: 500 });
  }

  return NextResponse.json(site satisfies SiteContent);
}
