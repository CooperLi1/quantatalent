import { type NextRequest } from "next/server"
import { getAdmin } from "@/lib/admin-auth"
import { semanticSearch, aiRoleMatch } from "@/lib/search"
import { rateLimit } from "@/lib/rate-limit"

export const runtime = "nodejs"
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { query, mode } = (await req.json().catch(() => ({}))) as {
    query?: string
    mode?: "semantic" | "ai"
  }
  const q = (query ?? "").trim()
  if (q.length < 2) return Response.json({ results: [] })

  // Bound LLM/embedding cost per admin.
  const limit = await rateLimit(`search:${admin.email}`, 40, 60)
  if (!limit.ok)
    return Response.json({ error: "Slow down a moment." }, { status: 429 })

  try {
    const results =
      mode === "ai" ? await aiRoleMatch(q.slice(0, 600)) : await semanticSearch(q.slice(0, 600))
    return Response.json({ results })
  } catch (err) {
    console.error("[admin/search]", err)
    return Response.json({ error: "Search failed." }, { status: 500 })
  }
}
