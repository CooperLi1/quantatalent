import { type NextRequest } from "next/server"
import { getAdmin } from "@/lib/admin-auth"
import { getCandidate, auditLog } from "@/lib/dal"
import { sendOutreachEmail } from "@/lib/email"
import { rateLimit } from "@/lib/rate-limit"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { candidateId, subject, body } = (await req.json().catch(() => ({}))) as {
    candidateId?: string
    subject?: string
    body?: string
  }
  if (!candidateId || !subject?.trim() || !body?.trim())
    return Response.json({ error: "Subject and message are required." }, { status: 400 })

  const limit = await rateLimit(`contact:${admin.email}`, 30, 60 * 60)
  if (!limit.ok) return Response.json({ error: "Rate limited." }, { status: 429 })

  const candidate = await getCandidate(candidateId)
  if (!candidate) return Response.json({ error: "Candidate not found." }, { status: 404 })

  const result = await sendOutreachEmail({
    candidateId,
    to: candidate.email,
    subject: subject.slice(0, 200),
    body: body.slice(0, 5000),
    adminEmail: admin.email,
  })
  await auditLog({
    adminEmail: admin.email,
    action: "contact",
    targetCandidateId: candidateId,
    meta: { subject: subject.slice(0, 200), ok: result.ok },
  })
  if (!result.ok) return Response.json({ error: result.error }, { status: 502 })
  return Response.json({ ok: true })
}
