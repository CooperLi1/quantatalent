import { type NextRequest } from "next/server"
import { getAdmin } from "@/lib/admin-auth"
import { getCandidate } from "@/lib/dal"
import { openai, CHAT_MODEL } from "@/lib/openai"
import { rateLimit } from "@/lib/rate-limit"

export const runtime = "nodejs"

/** Generate a short, personalized outreach draft from the candidate's profile. */
export async function POST(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { candidateId } = (await req.json().catch(() => ({}))) as { candidateId?: string }
  if (!candidateId) return Response.json({ error: "Missing candidateId" }, { status: 400 })

  const limit = await rateLimit(`draft:${admin.email}`, 30, 60)
  if (!limit.ok) return Response.json({ error: "Rate limited." }, { status: 429 })

  const c = await getCandidate(candidateId)
  if (!c) return Response.json({ error: "Candidate not found." }, { status: 404 })

  const tags = (c.ai_tags ?? {}) as { signals?: string[]; domains?: string[] }
  try {
    const completion = await openai().chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.5,
      max_tokens: 300,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'You write warm, concise, high-signal outreach from a venture team to an exceptional person who asked to join their community. 90-130 words. Specific, not generic; reference their actual background. No emojis, no hype. Return STRICT JSON {"subject":"...","body":"..."}. The body should open with "Hi <first name>," and close with a soft call to chat. JSON only.',
        },
        {
          role: "user",
          content: `Name: ${c.full_name}\nSummary: ${c.ai_summary ?? "—"}\nSignals: ${(tags.signals ?? []).join("; ") || "none"}\nDomains: ${(tags.domains ?? []).join(", ") || "—"}`,
        },
      ],
    })
    const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}")
    return Response.json({
      subject: String(parsed.subject ?? "An intro from the Quanta team").slice(0, 200),
      body: String(parsed.body ?? "").slice(0, 2000),
    })
  } catch (err) {
    console.error("[admin/draft]", err)
    return Response.json({ error: "Draft failed." }, { status: 500 })
  }
}
