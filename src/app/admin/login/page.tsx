import { redirect } from "next/navigation";

import { getAdminSession } from "@/server/auth";
import { hasCloudinaryConfig } from "@/lib/env";

import LoginPageClient from "./page.client";

export default async function AdminLoginPage() {
  const session = await getAdminSession();

  if (session) {
    redirect("/admin");
  }

  return <LoginPageClient cloudinaryReady={hasCloudinaryConfig()} />;
}
