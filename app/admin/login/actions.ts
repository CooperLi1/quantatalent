"use server"

import { headers } from "next/headers"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { isAdminEmail, env } from "@/lib/env"
import { clientIp, rateLimit } from "@/lib/rate-limit"

export interface LoginState {
  sent: boolean
  error?: string
}

/**
 * Send a magic link — but ONLY to allowlisted admin addresses. The response
 * is intentionally uniform so the form never reveals who is on the allowlist.
 */
export async function requestMagicLink(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") || "").toLowerCase().trim()
  if (!email) return { sent: false, error: "Enter your email." }

  const headerList = await headers()
  const ip = clientIp(headerList)
  const ipLimit = await rateLimit(`admin-login:ip:${ip}`, 10, 15 * 60)
  const emailLimit = await rateLimit(`admin-login:email:${email}`, 5, 15 * 60)
  if (!ipLimit.ok || !emailLimit.ok) return { sent: true }

  if (isAdminEmail(email)) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${env.siteUrl}/admin/auth/callback` },
    })
    if (error) console.error("[admin-login] otp error", error.message)
  }
  // Always report success uniformly.
  return { sent: true }
}
