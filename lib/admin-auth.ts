import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { isAdminEmail } from "@/lib/env"

export interface AdminUser {
  id: string
  email: string
}

/**
 * Returns the authenticated admin, or null. Cached per-request so layouts and
 * pages share one auth check. An authenticated Supabase user is only an admin
 * if their (verified) email is on the ADMIN_EMAILS allowlist.
 */
export const getAdmin = cache(async (): Promise<AdminUser | null> => {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email || !isAdminEmail(user.email)) return null
  return { id: user.id, email: user.email }
})

/** Guard for pages — redirects to login if not an admin. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin()
  if (!admin) redirect("/admin/login")
  return admin
}
