/**
 * Centralized environment access.
 *
 * Values are read lazily (not at module import) so that a missing optional
 * key never breaks the build — only the code path that needs it will throw,
 * with a clear message, at request time.
 */

function required(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required environment variable: ${name}`)
  return v
}

function optional(name: string): string | undefined {
  return process.env[name] || undefined
}

export const env = {
  // Supabase (public)
  get supabaseUrl() {
    return required("NEXT_PUBLIC_SUPABASE_URL")
  },
  get supabaseAnonKey() {
    return required("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  },
  // Supabase (secret — server only)
  get supabaseServiceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY")
  },
  // OpenAI
  get openaiKey() {
    return required("OPENAI_API_KEY")
  },
  // Resend
  get resendKey() {
    return optional("RESEND_API_KEY")
  },
  get emailFrom() {
    return process.env.EMAIL_FROM || "Quanta Talent <onboarding@resend.dev>"
  },
  get resendWebhookSecret() {
    return optional("RESEND_WEBHOOK_SECRET")
  },
  // Brave Search
  get braveKey() {
    return optional("BRAVE_SEARCH_API_KEY")
  },
  // Admin allowlist (comma-separated emails)
  get adminEmails(): string[] {
    return (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  },
  // Cron / internal job auth
  get cronSecret() {
    return optional("CRON_SECRET")
  },
  // Public site URL (for building absolute confirmation links)
  get siteUrl() {
    return (
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "http://localhost:3000")
    )
  },
} as const

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return env.adminEmails.includes(email.trim().toLowerCase())
}
