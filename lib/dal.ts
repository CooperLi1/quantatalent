import "server-only"

import { supabaseAdmin } from "@/lib/supabase/admin"
import type { Json } from "@/lib/types/database"

/** Columns safe to surface to the admin UI (never the raw embedding). */
const LIST_COLUMNS =
  "id, full_name, email, ai_summary, ai_tags, exceptional_score, exceptional_rationale, ingest_status, linkedin_url, resume_path, enrichment, enriched_at, confirmed_at, created_at"

export interface CandidateListItem {
  id: string
  full_name: string
  email: string
  ai_summary: string | null
  ai_tags: Json
  exceptional_score: number | null
  exceptional_rationale: string | null
  ingest_status: string
  linkedin_url: string | null
  resume_path: string | null
  enrichment: Json | null
  enriched_at: string | null
  confirmed_at: string | null
  created_at: string
  similarity?: number
}

export type SortKey = "score" | "recent"

/** List CONFIRMED candidates only. The dashboard never sees pending rows. */
export async function listCandidates(opts: {
  sort?: SortKey
  limit?: number
} = {}): Promise<CandidateListItem[]> {
  const { sort = "score", limit = 100 } = opts
  let q = supabaseAdmin()
    .from("candidates")
    .select(LIST_COLUMNS)
    .eq("status", "confirmed")
    .limit(limit)

  q = sort === "recent"
    ? q.order("confirmed_at", { ascending: false, nullsFirst: false })
    : q.order("exceptional_score", { ascending: false, nullsFirst: false })

  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []) as CandidateListItem[]
}

export async function getCandidate(id: string): Promise<CandidateListItem | null> {
  const { data, error } = await supabaseAdmin()
    .from("candidates")
    .select(LIST_COLUMNS)
    .eq("id", id)
    .eq("status", "confirmed")
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data as CandidateListItem) ?? null
}

/** Vector similarity search: RPC returns ids+similarity, then hydrate rows. */
export async function searchByVector(
  queryVector: string,
  matchCount = 20
): Promise<CandidateListItem[]> {
  const db = supabaseAdmin()
  const { data: matches, error } = await db.rpc("match_candidates", {
    query_embedding: queryVector,
    match_count: matchCount,
  })
  if (error) throw new Error(error.message)
  if (!matches?.length) return []

  const simById = new Map(matches.map((m) => [m.id, m.similarity]))
  const ids = matches.map((m) => m.id)
  const { data, error: e2 } = await db
    .from("candidates")
    .select(LIST_COLUMNS)
    .in("id", ids)
  if (e2) throw new Error(e2.message)

  return ((data ?? []) as CandidateListItem[])
    .map((c) => ({ ...c, similarity: simById.get(c.id) }))
    .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
}

/** Create a signed URL for downloading a private résumé. */
export async function signedResumeUrl(path: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin()
    .storage.from("resumes")
    .createSignedUrl(path, 60)
  if (error) return null
  return data.signedUrl
}

export async function auditLog(entry: {
  adminEmail: string
  action: string
  targetCandidateId?: string | null
  meta?: Record<string, unknown>
}): Promise<void> {
  await supabaseAdmin()
    .from("admin_audit")
    .insert({
      admin_email: entry.adminEmail,
      action: entry.action,
      target_candidate_id: entry.targetCandidateId ?? null,
      meta: (entry.meta ?? null) as Json,
    })
}
