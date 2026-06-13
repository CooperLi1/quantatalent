import { type NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { env } from "@/lib/env"

export const runtime = "nodejs"

/**
 * Purge unconfirmed signups older than 14 days (privacy retention).
 * Invoked by Vercel Cron with the Authorization: Bearer <CRON_SECRET> header,
 * which Vercel sets automatically from the CRON_SECRET env var.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!env.cronSecret || auth !== `Bearer ${env.cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const db = supabaseAdmin()

  // Collect ids first so we can clean up their résumé files.
  const { data: stale } = await db
    .from("candidates")
    .select("id")
    .eq("status", "pending")
    .lt("created_at", cutoff)

  if (stale?.length) {
    for (const { id } of stale) {
      const { data: files } = await db.storage.from("resumes").list(id)
      if (files?.length)
        await db.storage.from("resumes").remove(files.map((f) => `${id}/${f.name}`))
    }
    await db
      .from("candidates")
      .delete()
      .eq("status", "pending")
      .lt("created_at", cutoff)
  }

  return Response.json({ purged: stale?.length ?? 0 })
}
