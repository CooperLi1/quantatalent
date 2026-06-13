import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"
import { readAdminSession } from "@/lib/admin-session"

export interface AdminUser {
  id: string
  email: string
  username: string
}

/**
 * Returns the authenticated admin, or null. Cached per-request so layouts and
 * pages share one auth check.
 */
export const getAdmin = cache(async (): Promise<AdminUser | null> => {
  const session = await readAdminSession()
  if (!session) return null
  return {
    id: session.username,
    email: session.username,
    username: session.username,
  }
})

/** Guard for pages — redirects to login if not an admin. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin()
  if (!admin) redirect("/admin/login")
  return admin
}
