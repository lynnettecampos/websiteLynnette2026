import { NextResponse } from "next/server";

import { env, hasDatabaseConfig } from "@/lib/env";
import { verifyRequestSession } from "@/server/auth";
import { getMongoDatabase } from "@/server/mongodb";

const getDatabaseName = (): string | null => {
  try {
    const parsed = new URL(env.mongodbUri);
    const name = parsed.pathname.replace(/^\//, "").split("?")[0];
    return env.mongodbDb || (name.length > 0 ? name : null);
  } catch {
    return env.mongodbDb || null;
  }
};

export async function GET(request: Request) {
  const session = verifyRequestSession(request.headers.get("cookie") ?? undefined);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasConfig = hasDatabaseConfig();

  if (!hasConfig) {
    return NextResponse.json(
      {
        connected: false,
        hasConfig,
        reason: "Falta configurar MONGODB_URI",
        database: null,
      },
      { status: 503 },
    );
  }

  const database = getDatabaseName();

  try {
    const db = await getMongoDatabase();

    if (!db) {
      return NextResponse.json(
        {
          connected: false,
          hasConfig,
          reason: "No fue posible conectar con la base de datos (ver logs)",
          database,
        },
        { status: 503 },
      );
    }

    const [projectSample, clientSample] = await Promise.all([
      db.collection("projects").find({}, { projection: { _id: 0 }, limit: 1 }).toArray(),
      db
        .collection(env.mongodbClientsCollection)
        .find({}, { projection: { _id: 0 }, limit: 1 })
        .toArray(),
    ]);

    return NextResponse.json({
      connected: true,
      hasConfig,
      reason: null,
      database,
      sampleCounts: {
        projects: projectSample.length,
        clients: clientSample.length,
      },
    });
  } catch (error) {
    console.error("[Diagnostics] Database check failed", error);

    return NextResponse.json(
      {
        connected: false,
        hasConfig,
        reason: "No fue posible verificar la base de datos (ver logs del servidor)",
        database,
      },
      { status: 500 },
    );
  }
}
