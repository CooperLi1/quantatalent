import "server-only"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { braveSearch, fetchReadable, type WebResult } from "@/lib/brave"
import { openai, CHAT_MODEL } from "@/lib/openai"

export interface Enrichment {
  findings: string[] // bullet points, each ideally with a source
  confirmed_claims: string[]
  links: { title: string; url: string }[]
  notable: string
  generated_at: string
  query: string
}

const SYSTEM = `You are a research analyst verifying a candidate for an elite venture talent community. You are given web search snippets and excerpts of a few pages about a named person. Extract ONLY information that plausibly refers to THIS person (be conservative — if a result is clearly about someone else with the same name, ignore it).

Return STRICT JSON:
- "findings": string[] — concrete, sourced facts (achievements, roles, companies, awards). Each ≤140 chars. Max 8. Empty if nothing reliable.
- "confirmed_claims": string[] — claims from their application that the web appears to corroborate. Max 5.
- "notable": one sentence on the single most credible signal found, or "" if none.
Do not speculate. Do not invent. JSON only.`

/**
 * Enrich a candidate from public web sources. Admin-triggered, rate-limited
 * upstream, and cached (result stored on the row) so it's a one-time cost.
 */
export async function enrichCandidate(candidateId: string): Promise<{
  ok: boolean
  enrichment?: Enrichment
  error?: string
}> {
  const db = supabaseAdmin()
  const { data: c } = await db
    .from("candidates")
    .select("id, full_name, linkedin_url, ai_tags, blurb")
    .eq("id", candidateId)
    .single()
  if (!c) return { ok: false, error: "Candidate not found." }

  const tags = (c.ai_tags ?? {}) as { domains?: string[] }
  const domainHint = tags.domains?.[0] ? ` ${tags.domains[0]}` : ""
  const query = `${c.full_name}${domainHint}`.trim()

  let results: WebResult[]
  try {
    results = await braveSearch(query, 6)
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Search failed." }
  }

  // Fetch a few top pages in parallel (SSRF-guarded inside fetchReadable).
  const top = results.slice(0, 3)
  const pages = await Promise.all(top.map((r) => fetchReadable(r.url)))

  const context = [
    `Search results for "${query}":`,
    ...results.map(
      (r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.description}`
    ),
    "\nPage excerpts:",
    ...top.map((r, i) => (pages[i] ? `[${r.url}]\n${pages[i]}` : "")).filter(Boolean),
    `\nCandidate's own application says:\n${c.blurb.slice(0, 800)}`,
  ].join("\n\n")

  let parsed: Partial<Enrichment> = {}
  try {
    const completion = await openai().chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.1,
      max_tokens: 600,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: context.slice(0, 12000) },
      ],
    })
    parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}")
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Analysis failed." }
  }

  const enrichment: Enrichment = {
    findings: arr(parsed.findings).slice(0, 8),
    confirmed_claims: arr(parsed.confirmed_claims).slice(0, 5),
    links: results.slice(0, 5).map((r) => ({ title: r.title, url: r.url })),
    notable: typeof parsed.notable === "string" ? parsed.notable : "",
    generated_at: new Date().toISOString(),
    query,
  }

  await db
    .from("candidates")
    .update({ enrichment: enrichment as never, enriched_at: new Date().toISOString() })
    .eq("id", candidateId)

  return { ok: true, enrichment }
}

function arr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x) => typeof x === "string") : []
}
