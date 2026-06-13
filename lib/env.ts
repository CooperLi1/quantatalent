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

const fallbackSiteUrl = "https://quantatalent.vercel.app"

function normalizeUrl(value: string | undefined): string | undefined {
  if (!value) return undefined
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
  try {
    const url = new URL(withProtocol)
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined
    return url.origin
  } catch {
    return undefined
  }
}

function isLocalUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname.toLowerCase()
    return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host.endsWith(".local")
  } catch {
    return false
  }
}

function siteUrlCandidates(): string[] {
  return [
    normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL),
    normalizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL),
    normalizeUrl(process.env.VERCEL_URL),
  ].filter((value): value is string => Boolean(value))
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
  // Admin username/password auth.
  get adminUsername() {
    return optional("ADMIN_USERNAME")?.trim()
  },
  get adminPassword() {
    return optional("ADMIN_PASSWORD")
  },
  get adminPasswordHash() {
    return optional("ADMIN_PASSWORD_HASH")
  },
  get adminSessionSecret() {
    return (
      optional("ADMIN_SESSION_SECRET") ||
      optional("CRON_SECRET") ||
      required("SUPABASE_SERVICE_ROLE_KEY")
    )
  },
  // Cron / internal job auth
  get cronSecret() {
    return optional("CRON_SECRET")
  },
  // Public site URL (for building absolute confirmation links)
  get siteUrl() {
    return siteUrlCandidates()[0] || fallbackSiteUrl
  },
  get emailSiteUrl() {
    return siteUrlCandidates().find((url) => !isLocalUrl(url)) || fallbackSiteUrl
  },
} as const
