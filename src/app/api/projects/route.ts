import { NextResponse } from "next/server";

import type { Project } from "@/domain/projects";
import { getProjectBySlug, getProjects, refreshProjectsCache } from "@/data/projects";
import { hasDatabaseConfig } from "@/lib/env";
import { upsertProject } from "@/server/projects";
import { projectPayloadSchema } from "@/server/validation";
import { verifyRequestSession } from "@/server/auth";

export async function GET(request: Request) {
  const includePrivate = Boolean(
    verifyRequestSession(request.headers.get("cookie") ?? undefined),
  );
  const projects = await getProjects(includePrivate);

  return NextResponse.json(projects satisfies Project[]);
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

  const parseResult = projectPayloadSchema.safeParse(payload);

  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.flatten() }, { status: 400 });
  }

  if (await getProjectBySlug(parseResult.data.slug, true)) {
    return NextResponse.json(
      { error: "Ya existe un proyecto con ese slug." },
      { status: 409 },
    );
  }

  const project = await upsertProject(parseResult.data);

  if (!project) {
    return NextResponse.json({ error: "Failed to save project" }, { status: 500 });
  }

  await refreshProjectsCache();
  return NextResponse.json(project satisfies Project);
}
