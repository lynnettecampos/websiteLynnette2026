import { NextResponse } from "next/server";

import { createUploadSignature } from "@/server/cloudinary";
import { verifyRequestSession } from "@/server/auth";

export async function POST(request: Request) {
  const session = verifyRequestSession(request.headers.get("cookie") ?? undefined);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const bodyRecord: { folder?: unknown } =
    typeof body === "object" && body !== null ? (body as { folder?: unknown }) : {};
  const folder = typeof bodyRecord.folder === "string" ? bodyRecord.folder : undefined;

  const signature = createUploadSignature({ folder });

  if (!signature) {
    return NextResponse.json(
      { error: "Cloudinary credentials are not configured." },
      { status: 500 },
    );
  }

  return NextResponse.json(signature);
}
