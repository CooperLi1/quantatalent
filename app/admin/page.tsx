import { requireAdmin } from "@/lib/admin-auth"
import { listCandidates } from "@/lib/dal"
import { AdminDashboard, type Candidate } from "@/components/admin/dashboard"
import { signOut } from "./actions"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const admin = await requireAdmin()
  const candidates = await listCandidates({ sort: "score", limit: 200 })

  const scored = candidates.filter((c) => typeof c.exceptional_score === "number")
  const avg =
    scored.length > 0
      ? Math.round(
          scored.reduce((s, c) => s + (c.exceptional_score ?? 0), 0) / scored.length
        )
      : 0
  const enriched = candidates.filter((c) => c.enriched_at).length

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-6">
        <div>
          <div className="label">Quanta · Admin</div>
          <h1 className="mt-1 text-2xl font-medium text-foreground">Talent community</h1>
        </div>
        <div className="flex items-center gap-5">
          <span className="text-xs text-faint">{admin.email}</span>
          <form action={signOut}>
            <button className="label transition-colors hover:text-muted">Sign out</button>
          </form>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <Stat label="Confirmed" value={String(candidates.length)} />
        <Stat label="Avg signal" value={`${avg}/100`} />
        <Stat label="Enriched" value={String(enriched)} />
      </div>

      <AdminDashboard initial={candidates as unknown as Candidate[]} />
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-[#080809] px-4 py-3">
      <div className="label">{label}</div>
      <div className="mt-1 text-xl font-medium text-foreground">{value}</div>
    </div>
  )
}
