import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import type { Client } from "@/content/clients";
import { getClients, refreshClientsCache } from "@/data/clients";
import { hasDatabaseConfig } from "@/lib/env";
import { clientPayloadSchema } from "@/server/validation";
import { upsertClient } from "@/server/clients";
import { verifyRequestSession } from "@/server/auth";

const revalidatePublicClientPages = () => {
  revalidatePath("/");
  revalidatePath("/clientes");
};

const respondWithMongoError = (error: unknown, action: string) => {
  const detail =
    error instanceof Error && error.message.trim().length > 0
      ? error.message
      : typeof error === "string" && error.trim().length > 0
        ? error
        : "Error desconocido";

  console.error(`[Clients API] ${action}`, error);

  return NextResponse.json(
    { error: `${action}. Detalle: ${detail}` },
    { status: 500 },
  );
};

export async function GET() {
  const clients = await getClients();
  return NextResponse.json(clients satisfies Client[]);
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

  const parseResult = clientPayloadSchema.safeParse(payload);

  if (!parseResult.success) {
    const [firstIssue] = parseResult.error.issues;
    const fieldPath = firstIssue?.path.join(".");
    const errorMessage = fieldPath
      ? `${fieldPath}: ${firstIssue?.message ?? "Invalid request"}`
      : firstIssue?.message ?? "Invalid request";

    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }

  const existingClients = await getClients(true);
  if (existingClients.some((client) => client.slug === parseResult.data.slug)) {
    return NextResponse.json(
      { error: "Ya existe una persona, institución o colaborador con ese slug." },
      { status: 409 },
    );
  }

  try {
    const client = await upsertClient(parseResult.data);

    if (!client) {
      return NextResponse.json(
        {
          error:
            "No fue posible conectarse con MongoDB para guardar el cliente. Revisa las credenciales y el acceso de red.",
        },
        { status: 500 },
      );
    }

    await refreshClientsCache();
    revalidatePublicClientPages();
    return NextResponse.json(client satisfies Client);
  } catch (error) {
    return respondWithMongoError(error, "MongoDB rechazó la operación al guardar el cliente");
  }
}
