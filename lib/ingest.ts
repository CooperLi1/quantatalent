import "server-only"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { openai, CHAT_MODEL, embed, toVectorLiteral } from "@/lib/openai"
import type { CandidateRow } from "@/lib/types/database"

export interface AiTags {
  domains: string[]
  skills: string[]
  seniority: string
  signals: string[] // concrete proof-of-exceptional evidence
}

export interface IngestResult {
  summary: string
  tags: AiTags
  exceptional_score: number
  exceptional_rationale: string
}

const SYSTEM_PROMPT = `You are the talent analyst for an elite venture community whose mandate is to find people who have demonstrably reached the top 0.01% of a field: future founders, venture scouts, and exceptional operators.

You are given a candidate's self-description and (optionally) their résumé text. Produce a STRICT JSON object with these keys:

- "summary": 2-3 sentence, third-person, factual analyst summary. No hype, no adjectives like "amazing". Lead with what makes them notable.
- "tags": {
    "domains": string[] (e.g. "AI infrastructure", "fintech"; max 6),
    "skills": string[] (concrete; max 8),
    "seniority": one of "student", "early-career", "mid", "senior", "staff+", "founder", "executive",
    "signals": string[] — ONLY concrete, verifiable proof-of-exceptional evidence actually present in the input (e.g. "IMO gold medal", "Founded company acquired by X", "Staff Eng at OpenAI", "YC W21", "Cited paper at NeurIPS"). Empty array if none. Never invent.
  }
- "exceptional_score": integer 0-100. Calibrate strictly: 90+ requires multiple world-class signals (olympiad medals, notable exits, top-lab research, FAANG Staff+); 70-89 strong signals; 40-69 solid but unproven; <40 little concrete evidence. Absence of a résumé caps confidence — do not reward fluent writing.
- "exceptional_rationale": 1-2 sentences justifying the score, citing the specific signals (or their absence).

Base every claim ONLY on the provided text. Do not fabricate. Output JSON only.`

function buildUserPrompt(c: {
  full_name: string
  blurb: string
  linkedin_url: string | null
  resume_text: string | null
}): string {
  const parts = [
    `Name: ${c.full_name}`,
    c.linkedin_url ? `LinkedIn: ${c.linkedin_url}` : null,
    `\nWhy they are exceptional / why they want to join:\n${c.blurb}`,
    c.resume_text
      ? `\nRésumé (truncated):\n${c.resume_text.slice(0, 6000)}`
      : `\n(No résumé provided.)`,
  ].filter(Boolean)
  return parts.join("\n")
}

/** Run the model. Pure function — no DB side effects, easy to test. */
export async function analyzeCandidate(c: {
  full_name: string
  blurb: string
  linkedin_url: string | null
  resume_text: string | null
}): Promise<IngestResult> {
  const completion = await openai().chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0.2,
    max_tokens: 700,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(c) },
    ],
  })

  const raw = completion.choices[0]?.message?.content ?? "{}"
  const parsed = JSON.parse(raw) as Partial<IngestResult>

  const tags = (parsed.tags ?? {}) as Partial<AiTags>
  return {
    summary: String(parsed.summary ?? "").slice(0, 1000),
    tags: {
      domains: Array.isArray(tags.domains) ? tags.domains.slice(0, 6) : [],
      skills: Array.isArray(tags.skills) ? tags.skills.slice(0, 8) : [],
      seniority: typeof tags.seniority === "string" ? tags.seniority : "unknown",
      signals: Array.isArray(tags.signals) ? tags.signals.slice(0, 10) : [],
    },
    exceptional_score: clampScore(parsed.exceptional_score),
    exceptional_rationale: String(parsed.exceptional_rationale ?? "").slice(0, 600),
  }
}

function clampScore(n: unknown): number {
  const v = Math.round(Number(n))
  if (!Number.isFinite(v)) return 0
  return Math.max(0, Math.min(100, v))
}

/** Compact string used for the semantic-search embedding. */
function embeddingInput(c: CandidateRow, r: IngestResult): string {
  return [
    c.full_name,
    r.summary,
    `Domains: ${r.tags.domains.join(", ")}`,
    `Skills: ${r.tags.skills.join(", ")}`,
    `Seniority: ${r.tags.seniority}`,
    `Signals: ${r.tags.signals.join("; ")}`,
    c.blurb,
  ].join("\n")
}

/**
 * Full pipeline for one candidate: analyze + embed + persist. Idempotent and
 * defensive — marks ingest_status so failures are visible and retryable.
 * Runs immediately on signup (data ready before email confirmation).
 */
export async function ingestCandidate(candidateId: string): Promise<void> {
  const db = supabaseAdmin()

  const { data: candidate, error } = await db
    .from("candidates")
    .select("*")
    .eq("id", candidateId)
    .single()
  if (error || !candidate) {
    console.error("[ingest] candidate not found", candidateId, error?.message)
    return
  }

  await db
    .from("candidates")
    .update({ ingest_status: "processing", ingest_error: null })
    .eq("id", candidateId)

  try {
    const result = await analyzeCandidate(candidate)
    const vector = await embed(embeddingInput(candidate, result))

    await db
      .from("candidates")
      .update({
        ai_summary: result.summary,
        ai_tags: result.tags,
        exceptional_score: result.exceptional_score,
        exceptional_rationale: result.exceptional_rationale,
        embedding: toVectorLiteral(vector),
        ingest_status: "done",
        ingest_error: null,
      })
      .eq("id", candidateId)
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error"
    console.error("[ingest] failed", candidateId, message)
    await db
      .from("candidates")
      .update({ ingest_status: "error", ingest_error: message.slice(0, 500) })
      .eq("id", candidateId)
  }
}
