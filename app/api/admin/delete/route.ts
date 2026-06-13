import { type NextRequest } from "next/server"
import { getAdmin } from "@/lib/admin-auth"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { auditLog } from "@/lib/dal"

export const runtime = "nodejs"

/** Permanently remove a candidate and their résumé (GDPR / admin action). */
export async function POST(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { candidateId } = (await req.json().catch(() => ({}))) as { candidateId?: string }
  if (!candidateId) return Response.json({ error: "Missing candidateId" }, { status: 400 })

  const db = supabaseAdmin()

  // Remove any résumé files under the candidate's folder.
  const { data: files } = await db.storage.from("resumes").list(candidateId)
  if (files?.length) {
    await db.storage
      .from("resumes")
      .remove(files.map((f) => `${candidateId}/${f.name}`))
  }

  const { error } = await db.from("candidates").delete().eq("id", candidateId)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  await auditLog({
    adminEmail: admin.email,
    action: "delete_candidate",
    meta: { deleted_id: candidateId },
  })
  return Response.json({ ok: true })
}
