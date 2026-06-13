import { type NextRequest } from "next/server"
import { getAdmin } from "@/lib/admin-auth"
import { getCandidate, signedResumeUrl, auditLog } from "@/lib/dal"

export const runtime = "nodejs"

/** Mint a short-lived signed URL for a private résumé. */
export async function POST(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { candidateId } = (await req.json().catch(() => ({}))) as { candidateId?: string }
  if (!candidateId) return Response.json({ error: "Missing candidateId" }, { status: 400 })

  const c = await getCandidate(candidateId)
  if (!c?.resume_path) return Response.json({ error: "No résumé on file." }, { status: 404 })

  const url = await signedResumeUrl(c.resume_path)
  if (!url) return Response.json({ error: "Could not create link." }, { status: 500 })

  await auditLog({ adminEmail: admin.email, action: "view_resume", targetCandidateId: candidateId })
  return Response.json({ url })
}
