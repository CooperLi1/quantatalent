import "server-only"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { env } from "@/lib/env"
import type { Database } from "@/lib/types/database"

/**
 * Cookie-bound Supabase client used ONLY for admin authentication
 * (magic-link sessions). It uses the public anon key; RLS denies it all
 * table access, so it can read the auth session but cannot touch candidate
 * data. All privileged reads go through the service-role DAL after the
 * session's email is checked against the admin allowlist.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Called from a Server Component where cookies are read-only.
          // The session is refreshed by middleware / route handlers instead.
        }
      },
    },
  })
}
