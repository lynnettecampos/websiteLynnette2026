import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { attachSessionCookie, createAdminSession } from "@/server/auth";

export async function POST(request: Request) {
  if (!env.adminEmail || !env.adminPassword || !env.adminSessionSecret) {
    return NextResponse.json(
      { error: "Authentication is not configured. Set ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_SESSION_SECRET." },
      { status: 500 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email =
    typeof body === "object" && body !== null ? (body as Record<string, unknown>).email : undefined;
  const password =
    typeof body === "object" && body !== null ? (body as Record<string, unknown>).password : undefined;

  if (typeof email !== "string" || email.trim().length === 0) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  if (typeof password !== "string" || password.length === 0) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail !== env.adminEmail || password !== env.adminPassword) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = createAdminSession();

  if (!token) {
    return NextResponse.json(
      { error: "Unable to create session. Verify ADMIN_SESSION_SECRET is configured." },
      { status: 500 },
    );
  }

  const response = NextResponse.json({ success: true });
  attachSessionCookie(response, token);
  return response;
}
