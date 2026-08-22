import { redirect } from "next/navigation";

import { getAdminSession } from "@/server/auth";

import LoginPageClient from "./page.client";

export default async function AdminLoginPage() {
  const session = await getAdminSession();

  if (session) {
    redirect("/admin");
  }

  return <LoginPageClient />;
}
