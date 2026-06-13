import "server-only"

import { supabaseAdmin } from "@/lib/supabase/admin"

/**
 * Postgres-backed fixed-window rate limiter. Atomic via the
 * `bump_rate_limit` RPC (INSERT ... ON CONFLICT DO UPDATE). No external
 * service required.
 *
 * Returns whether the action is allowed plus the current count.
 */
export async function rateLimit(
  bucket: string,
  limit: number,
  windowSeconds: number
): Promise<{ ok: boolean; count: number }> {
  const { data, error } = await supabaseAdmin().rpc("bump_rate_limit", {
    p_bucket: bucket,
    p_window_seconds: windowSeconds,
  })
  if (error) {
    // Fail OPEN for availability but log — a limiter outage shouldn't take
    // down signups. Security-critical buckets can choose to fail closed.
    console.error("[rate-limit] error", error.message)
    return { ok: true, count: 0 }
  }
  const count = data ?? 0
  return { ok: count <= limit, count }
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0].trim()
  return headers.get("x-real-ip") || "0.0.0.0"
}
