import { type NextRequest } from "next/server"
import { getAdmin } from "@/lib/admin-auth"
import { getCandidate } from "@/lib/dal"
import { semanticSearch } from "@/lib/search"
import { rateLimit } from "@/lib/rate-limit"

export const runtime = "nodejs"

/** "Find people like this one" — vector neighbors of a candidate's profile. */
export async function POST(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { candidateId } = (await req.json().catch(() => ({}))) as { candidateId?: string }
  if (!candidateId) return Response.json({ error: "Missing candidateId" }, { status: 400 })

  const limit = await rateLimit(`similar:${admin.email}`, 40, 60)
  if (!limit.ok) return Response.json({ error: "Rate limited." }, { status: 429 })

  const c = await getCandidate(candidateId)
  if (!c) return Response.json({ error: "Candidate not found." }, { status: 404 })

  const tags = (c.ai_tags ?? {}) as { signals?: string[]; domains?: string[] }
  const query = [
    c.ai_summary ?? "",
    (tags.domains ?? []).join(", "),
    (tags.signals ?? []).join("; "),
  ].join("\n")

  const results = (await semanticSearch(query, 8)).filter((r) => r.id !== candidateId)
  return Response.json({ results })
}
