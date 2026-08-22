import { NextResponse } from "next/server";

import type { Project } from "@/domain/projects";
import { getProjectBySlug } from "@/data/projects";
import { CONTENT_CACHE_TAGS, invalidatePublicContent } from "@/lib/content-cache";
import { hasDatabaseConfig } from "@/lib/env";
import { deleteProject, upsertProject } from "@/server/projects";
import { projectPayloadSchema } from "@/server/validation";
import { verifyRequestSession } from "@/server/auth";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const params = await context.params;
  const includePrivate = Boolean(
    verifyRequestSession(request.headers.get("cookie") ?? undefined),
  );
  const project = await getProjectBySlug(params.slug, includePrivate);

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(project satisfies Project);
}

export async function PATCH(request: Request, context: RouteContext) {
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

  const params = await context.params;

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const bodyRecord: Record<string, unknown> =
    typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : {};

  const parseResult = projectPayloadSchema.safeParse({ ...bodyRecord, slug: params.slug });

  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.flatten() }, { status: 400 });
  }

  const project = await upsertProject(parseResult.data);

  if (!project) {
    return NextResponse.json({ error: "Failed to save project" }, { status: 500 });
  }

  invalidatePublicContent(CONTENT_CACHE_TAGS.projects);
  return NextResponse.json(project satisfies Project);
}

export async function DELETE(request: Request, context: RouteContext) {
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

  const params = await context.params;

  const success = await deleteProject(params.slug);

  if (!success) {
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }

  invalidatePublicContent(CONTENT_CACHE_TAGS.projects);
  return NextResponse.json({ success: true });
}
