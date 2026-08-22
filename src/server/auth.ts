import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, randomBytes } from "node:crypto";

import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  env,
} from "@/lib/env";

export type AdminSession = {
  subject: string;
  expiresAt: number;
  nonce: string;
};

const encodeSession = (payload: AdminSession): string | null => {
  if (!env.adminSessionSecret) {
    return null;
  }

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", env.adminSessionSecret)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
};

const decodeSession = (token: string): AdminSession | null => {
  if (!env.adminSessionSecret) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = createHmac("sha256", env.adminSessionSecret)
    .update(encodedPayload)
    .digest("base64url");

  if (expectedSignature !== signature) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as AdminSession;

    if (typeof payload.expiresAt !== "number" || payload.expiresAt * 1000 < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
};

export const createAdminSession = (): string | null => {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + ADMIN_SESSION_MAX_AGE_SECONDS;

  return encodeSession({
    subject: "admin",
    expiresAt,
    nonce: randomBytes(16).toString("hex"),
  });
};

export const getAdminSession = async (): Promise<AdminSession | null> => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE);

  if (!sessionCookie?.value) {
    return null;
  }

  return decodeSession(sessionCookie.value);
};

export const requireAdminSession = async (): Promise<AdminSession> => {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
};

export const attachSessionCookie = <T extends Response>(response: T, token: string): T => {
  response.headers.append(
    "Set-Cookie",
    `${ADMIN_SESSION_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${ADMIN_SESSION_MAX_AGE_SECONDS}; SameSite=Lax${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`,
  );

  return response;
};

export const clearSessionCookie = <T extends Response>(response: T): T => {
  response.headers.append(
    "Set-Cookie",
    `${ADMIN_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`,
  );

  return response;
};

export const verifyRequestSession = (cookieHeader: string | undefined): AdminSession | null => {
  if (!cookieHeader) {
    return null;
  }

  const cookiePattern = new RegExp(`${ADMIN_SESSION_COOKIE}=([^;]+)`);
  const match = cookieHeader.match(cookiePattern);

  if (!match) {
    return null;
  }

  return decodeSession(match[1]);
};
