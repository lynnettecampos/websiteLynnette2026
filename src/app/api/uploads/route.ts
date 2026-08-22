import { NextResponse } from "next/server";

import { verifyRequestSession } from "@/server/auth";
import { createUploadSignature } from "@/server/cloudinary";

export async function POST(request: Request) {
  const session = verifyRequestSession(request.headers.get("cookie") ?? undefined);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const folderEntry = formData.get("folder");
  const folder = typeof folderEntry === "string" && folderEntry.length > 0 ? folderEntry : undefined;

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "No se recibió un archivo válido" }, { status: 400 });
  }

  const signature = createUploadSignature({ folder });

  if (!signature) {
    return NextResponse.json(
      { error: "Cloudinary credentials are not configured." },
      { status: 500 },
    );
  }

  const uploadForm = new FormData();
  uploadForm.append("file", file);
  uploadForm.append("api_key", signature.apiKey);
  uploadForm.append("timestamp", String(signature.timestamp));
  uploadForm.append("signature", signature.signature);

  if (signature.folder) {
    uploadForm.append("folder", signature.folder);
  }

  const uploadResponse = await fetch(signature.uploadUrl, {
    method: "POST",
    body: uploadForm,
  });

  const text = await uploadResponse.text();

  let payload: { public_id?: string; secure_url?: string; url?: string; error?: unknown } | null;

  try {
    payload = text.length > 0 ? (JSON.parse(text) as typeof payload) : null;
  } catch {
    payload = null;
  }

  if (!uploadResponse.ok || !payload || !payload.public_id) {
    let message = "Cloudinary rechazó la carga";

    if (payload && typeof payload.error === "object" && payload.error !== null) {
      const errorRecord = payload.error as { message?: unknown; error?: unknown };
      const explicitMessage = [errorRecord.message, errorRecord.error]
        .map((value) => (typeof value === "string" ? value : ""))
        .find((value) => value.length > 0);

      if (explicitMessage) {
        message = explicitMessage;
      }
    } else if (payload && typeof payload.error === "string" && payload.error.length > 0) {
      message = payload.error;
    }

    return NextResponse.json({ error: message }, { status: uploadResponse.status || 500 });
  }

  return NextResponse.json({
    publicId: payload.public_id,
    src: payload.secure_url ?? payload.url ?? "",
  });
}
