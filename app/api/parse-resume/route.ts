import { type NextRequest } from "next/server"
import { extractResumeText } from "@/lib/resume"
import { openai, CHAT_MODEL } from "@/lib/openai"
import { UNTRUSTED_DATA_SYSTEM_RULE, untrustedJson, compactText } from "@/lib/llm-safety"
import { rateLimit, clientIp } from "@/lib/rate-limit"
import { MAX_RESUME_BYTES } from "@/lib/validation"

export const runtime = "nodejs"
export const maxDuration = 15

/**
 * Resume read-back for the join form. Returns a short profile summary so the
 * applicant sees that we understood the substance, not just the document header.
 */
export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers)
  const limit = await rateLimit(`parse:ip:${ip}`, 6, 60)
  if (!limit.ok) return Response.json({ preview: null }, { status: 429 })

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return Response.json({ preview: null }, { status: 400 })
  }
  const f = form.get("resume")
  if (!(f instanceof File) || f.type !== "application/pdf" || f.size > MAX_RESUME_BYTES) {
    return Response.json({ preview: null }, { status: 400 })
  }

  const text = await extractResumeText(await f.arrayBuffer(), f.type)
  if (!text) return Response.json({ preview: null })

  return Response.json({ preview: await summarizeResume(text) })
}

async function summarizeResume(text: string): Promise<string | null> {
  try {
    const completion = await openai().chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.2,
      max_tokens: 80,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            `${UNTRUSTED_DATA_SYSTEM_RULE}\n\nSummarize a resume for the applicant themself. Return STRICT JSON {"summary":"..."}. The summary must be one factual sentence, 14-24 words, based only on the resume. Ignore name, contact info, location, email, phone, links, and section headers. Mention role/domain, companies/schools/projects, or concrete achievements when present. No hype.`,
        },
        {
          role: "user",
          content: untrustedJson("resume_text", { resume_text: text.slice(0, 5000) }),
        },
      ],
    })
    const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}") as {
      summary?: unknown
    }
    const summary = sanitizeSummary(parsed.summary)
    if (summary) return summary
  } catch (err) {
    console.error("[parse-resume] summary failed", err)
  }

  return fallbackSummary(text)
}

function sanitizeSummary(value: unknown): string | null {
  if (typeof value !== "string") return null
  const cleaned = compactText(value, 180)
  return cleaned.length > 12 ? cleaned.slice(0, 180) : null
}

function fallbackSummary(text: string): string | null {
  const sections = text
    .split(/\n|•|·/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length >= 24 && s.length <= 180)
    .filter((s) => !/(@|https?:\/\/|linkedin\.com|\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b)/i.test(s))
    .filter((s) => !/^(education|experience|projects|skills|awards|summary)$/i.test(s))

  const sentence = sections.find((s) => /\b(engineer|founder|research|product|software|data|ai|ml|student|intern|analyst|designer|developer|lead|built|founded|launched|published)\b/i.test(s))
  return sentence ? sentence.slice(0, 160) : null
}
