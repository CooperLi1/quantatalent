import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"
import { env } from "@/lib/env"
import type { Database } from "@/lib/types/database"

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    env.supabaseUrl,
    env.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headersToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
          Object.entries(headersToSet).forEach(([key, value]) => {
            response.headers.set(key, value)
          })
        },
      },
    }
  )

  try {
    await supabase.auth.getClaims()
  } catch {
    // Auth is enforced by the admin page and API guards. This proxy only keeps
    // Supabase SSR cookies fresh when a session exists.
  }

  return response
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}
