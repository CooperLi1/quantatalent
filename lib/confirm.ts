import "server-only"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { hashToken } from "@/lib/crypto"

export type ConfirmOutcome =
  | { status: "confirmed"; fullName: string; summary: string | null; score: number | null }
  | { status: "already"; fullName: string; summary: string | null; score: number | null }
  | { status: "expired" }
  | { status: "invalid" }

/**
 * Validate a raw confirmation token and, if good, flip the candidate to
 * `confirmed`. Idempotent: a second click reports "already". Tokens are
 * single-use and time-limited; only the SHA-256 hash is ever compared.
 */
export async function confirmByToken(rawToken: string): Promise<ConfirmOutcome> {
  if (!rawToken || rawToken.length < 16) return { status: "invalid" }
  const db = supabaseAdmin()
  const hash = hashToken(rawToken)

  const { data: token } = await db
    .from("confirmation_tokens")
    .select("id, candidate_id, expires_at, used_at")
    .eq("token_hash", hash)
    .maybeSingle()

  if (!token) return { status: "invalid" }

  const candidateInfo = async () => {
    const { data } = await db
      .from("candidates")
      .select("full_name, ai_summary, exceptional_score, status")
      .eq("id", token.candidate_id)
      .single()
    return data
  }

  // Already used → idempotent success if the candidate is confirmed.
  if (token.used_at) {
    const c = await candidateInfo()
    if (c?.status === "confirmed")
      return { status: "already", fullName: c.full_name, summary: c.ai_summary, score: c.exceptional_score }
    return { status: "invalid" }
  }

  if (new Date(token.expires_at).getTime() < Date.now()) return { status: "expired" }

  // Mark token used + candidate confirmed.
  const now = new Date().toISOString()
  const { data: claimed, error: claimError } = await db
    .from("confirmation_tokens")
    .update({ used_at: now })
    .eq("id", token.id)
    .is("used_at", null)
    .select("id")
    .maybeSingle()
  if (claimError) {
    console.error("[confirm] token claim failed", claimError.message)
    return { status: "invalid" }
  }
  if (!claimed) {
    const c = await candidateInfo()
    if (c?.status === "confirmed")
      return { status: "already", fullName: c.full_name, summary: c.ai_summary, score: c.exceptional_score }
    return { status: "invalid" }
  }

  const { error: candidateError } = await db
    .from("candidates")
    .update({ status: "confirmed", confirmed_at: now })
    .eq("id", token.candidate_id)
  if (candidateError) {
    console.error("[confirm] candidate update failed", candidateError.message)
    return { status: "invalid" }
  }

  const c = await candidateInfo()
  return {
    status: "confirmed",
    fullName: c?.full_name ?? "",
    summary: c?.ai_summary ?? null,
    score: c?.exceptional_score ?? null,
  }
}
