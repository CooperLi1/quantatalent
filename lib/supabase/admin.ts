import "server-only"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { env } from "@/lib/env"
import type { Database } from "@/lib/types/database"

/**
 * Service-role Supabase client. Bypasses RLS — must ONLY ever be used in
 * server-side code (route handlers, server actions, the DAL). The
 * `server-only` import guarantees a build error if it leaks into a client
 * bundle.
 */
let cached: SupabaseClient<Database> | null = null

export function supabaseAdmin(): SupabaseClient<Database> {
  if (cached) return cached
  cached = createClient<Database>(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  return cached
}
