import { type NextRequest } from "next/server"
import { extractResumeText } from "@/lib/resume"
import { rateLimit, clientIp } from "@/lib/rate-limit"
import { MAX_RESUME_BYTES } from "@/lib/validation"

export const runtime = "nodejs"
export const maxDuration = 15

/**
 * Free, extraction-only résumé read-back for the join form. Returns a short
 * preview so the applicant sees that we already understood their document.
 * No LLM tokens are spent here.
 */
export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers)
  const limit = await rateLimit(`parse:ip:${ip}`, 20, 60)
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

  // Take the first substantive line(s) as a friendly preview.
  const firstLines = text
    .split(/\n|\.|·|•/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3)
    .slice(0, 2)
    .join(" · ")
  return Response.json({ preview: firstLines.slice(0, 160) || null })
}
