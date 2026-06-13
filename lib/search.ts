import "server-only"

import { embed, toVectorLiteral, openai, CHAT_MODEL } from "@/lib/openai"
import { searchByVector, type CandidateListItem } from "@/lib/dal"
import { UNTRUSTED_DATA_SYSTEM_RULE, untrustedJson, compactText } from "@/lib/llm-safety"

export interface RankedCandidate extends CandidateListItem {
  reason?: string
  rank?: number
}

/**
 * Pure semantic search: one embedding call, then pgvector cosine search.
 * Essentially free per query — no generation tokens.
 */
export async function semanticSearch(
  query: string,
  count = 20
): Promise<CandidateListItem[]> {
  const vec = await embed(query)
  return searchByVector(toVectorLiteral(vec), count)
}

/**
 * AI role match (two-stage, cost-bounded):
 *   1) vector pre-filter to a small shortlist (one embedding call)
 *   2) ONE cheap completion ranks the shortlist using compact summaries only
 *      (never résumé text), returning the top few with a one-line rationale.
 * Token cost is constant regardless of community size.
 */
export async function aiRoleMatch(
  query: string,
  opts: { shortlist?: number; topK?: number } = {}
): Promise<RankedCandidate[]> {
  const { shortlist = 15, topK = 5 } = opts
  const candidates = await semanticSearch(query, shortlist)
  if (candidates.length === 0) return []

  const compact = candidates.map((c, i) => {
    const tags = (c.ai_tags ?? {}) as { signals?: string[]; domains?: string[] }
    return `#${i} | ${c.full_name} | score ${c.exceptional_score ?? "?"} | ${
      (tags.domains ?? []).join(", ") || "—"
    }\nsummary: ${c.ai_summary ?? "—"}\nsignals: ${(tags.signals ?? []).join("; ") || "none"}`
  })

  const completion = await openai().chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0.2,
    max_tokens: 500,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You match people in an elite talent pool to a hiring need.\n\n${UNTRUSTED_DATA_SYSTEM_RULE}\n\nGiven a request and a numbered shortlist, return STRICT JSON {"ranked":[{"i":<index>,"reason":"<≤120 chars why this person fits>"}]} with the best ${topK} candidates, best first. Only include genuinely relevant people; fewer is fine. Reason must reference concrete fit. JSON only.`,
      },
      {
        role: "user",
        content: untrustedJson("role_match_request_and_shortlist", {
          request: query,
          shortlist: compact,
        }),
      },
    ],
  })

  let ranked: { i: number; reason: string }[] = []
  try {
    const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}")
    ranked = Array.isArray(parsed.ranked) ? parsed.ranked : []
  } catch {
    // Fall back to raw vector order if the model returns malformed JSON.
    return candidates.slice(0, topK).map((c, i) => ({ ...c, rank: i + 1 }))
  }

  const out: RankedCandidate[] = []
  ranked.forEach((r, idx) => {
    const i = Number(r.i)
    if (!Number.isInteger(i) || i < 0 || i >= candidates.length) return
    const c = candidates[i]
    const reason = compactText(r.reason, 120)
    if (c) out.push({ ...c, reason, rank: idx + 1 })
  })
  return out
}
