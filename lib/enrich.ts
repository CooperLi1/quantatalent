import "server-only"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { braveSearch, fetchReadable, type WebResult } from "@/lib/brave"
import { openai, CHAT_MODEL } from "@/lib/openai"
import { UNTRUSTED_DATA_SYSTEM_RULE, untrustedJson, compactText } from "@/lib/llm-safety"

export interface Enrichment {
  findings: string[] // bullet points, each ideally with a source
  confirmed_claims: string[]
  links: { title: string; url: string }[]
  notable: string
  source_indexes: number[]
  generated_at: string
  query: string
}

const SYSTEM = `You are a research analyst verifying a candidate for an elite venture talent community. You are given a candidate's self-submitted application plus public web search snippets and page excerpts about a named person.

Your job is entity resolution first, enrichment second:
- Extract ONLY information that plausibly refers to THIS candidate.
- Be especially conservative for common names.
- Prefer sources that match at least one candidate anchor: LinkedIn URL, unusual full name, domain, role, company, school, project, geography, or claims from the application.
- If a source could be about a different person with the same/similar name, discard it.
- If the evidence does not logically line up with the candidate, return empty findings rather than guessing.

${UNTRUSTED_DATA_SYSTEM_RULE}

Return STRICT JSON:
- "findings": string[] — concrete, sourced facts (achievements, roles, companies, awards). Each ≤140 chars. Max 8. Empty if nothing reliable.
- "confirmed_claims": string[] — claims from their application that the web appears to corroborate. Max 5.
- "notable": one sentence on the single most credible signal found, or "" if none.
- "source_indexes": number[] — 1-based search result indexes that plausibly match this candidate and support the accepted findings. Max 5.
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

  const context = untrustedJson("candidate_web_research", {
    query,
    search_results: results.map((r, i) => ({
      index: i + 1,
      title: r.title,
      url: r.url,
      description: r.description,
    })),
    page_excerpts: top
      .map((r, i) => (pages[i] ? { url: r.url, excerpt: pages[i] } : null))
      .filter(Boolean),
    candidate_name: c.full_name,
    candidate_linkedin_url: c.linkedin_url,
    candidate_domains: tags.domains ?? [],
    candidate_application_blurb: c.blurb.slice(0, 800),
  }, 12000)

  let parsed: Partial<Enrichment> = {}
  try {
    const completion = await openai().chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.1,
      max_tokens: 600,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: context },
      ],
    })
    parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}")
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Analysis failed." }
  }

  const sourceIndexes = acceptedIndexes(parsed.source_indexes, results.length)
  const acceptedLinks =
    sourceIndexes.length > 0
      ? sourceIndexes.map((i) => results[i - 1]).filter(Boolean)
      : []

  const enrichment: Enrichment = {
    findings: arr(parsed.findings).map((s) => compactText(s, 140)).filter(Boolean).slice(0, 8),
    confirmed_claims: arr(parsed.confirmed_claims).map((s) => compactText(s, 160)).filter(Boolean).slice(0, 5),
    links: acceptedLinks.slice(0, 5).map((r) => ({ title: r.title, url: r.url })),
    notable: compactText(parsed.notable, 220),
    source_indexes: sourceIndexes,
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

function acceptedIndexes(v: unknown, max: number): number[] {
  if (!Array.isArray(v)) return []
  return Array.from(
    new Set(
      v
        .map((x) => (typeof x === "number" ? x : Number.parseInt(String(x), 10)))
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= max)
    )
  ).slice(0, 5)
}
