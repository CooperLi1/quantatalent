import { type NextRequest } from "next/server"
import { getAdmin } from "@/lib/admin-auth"
import { enrichCandidate } from "@/lib/enrich"
import { auditLog } from "@/lib/dal"
import { rateLimit } from "@/lib/rate-limit"

export const runtime = "nodejs"
export const maxDuration = 45

export async function POST(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { candidateId } = (await req.json().catch(() => ({}))) as { candidateId?: string }
  if (!candidateId) return Response.json({ error: "Missing candidateId" }, { status: 400 })

  // Web scraping + LLM is the most expensive path — limit hard.
  const limit = await rateLimit(`enrich:${admin.email}`, 10, 60)
  if (!limit.ok) return Response.json({ error: "Rate limited." }, { status: 429 })

  const result = await enrichCandidate(candidateId)
  await auditLog({
    adminEmail: admin.email,
    action: "enrich",
    targetCandidateId: candidateId,
    meta: { ok: result.ok, error: result.error },
  })
  if (!result.ok) return Response.json({ error: result.error }, { status: 502 })
  return Response.json({ enrichment: result.enrichment })
}
