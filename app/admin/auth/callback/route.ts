import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { env } from "@/lib/env"
import type { Database } from "@/lib/types/database"

export const runtime = "nodejs"

/** Exchanges the magic-link code for a session cookie, then enters the dashboard. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const origin = url.origin
  let response = NextResponse.redirect(`${origin}/admin`)

  if (code) {
    const supabase = createServerClient<Database>(
      env.supabaseUrl,
      env.supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll()
          },
          setAll(cookiesToSet, headersToSet) {
            cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
            response = NextResponse.redirect(`${origin}/admin`)
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
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(`${origin}/admin/login?error=auth`)
    }
  }
  return response
}
