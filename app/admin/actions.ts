"use server"

import { redirect } from "next/navigation"
import { clearAdminSession } from "@/lib/admin-session"

export async function signOut() {
  await clearAdminSession()
  redirect("/admin/login")
}
