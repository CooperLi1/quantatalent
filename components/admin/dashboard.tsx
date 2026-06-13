"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

// Local view model (mirrors the DAL's display columns; kept here so this
// client module never imports the server-only DAL).
export interface Candidate {
  id: string
  full_name: string
  email: string
  ai_summary: string | null
  ai_tags: { domains?: string[]; skills?: string[]; seniority?: string; signals?: string[] } | null
  exceptional_score: number | null
  exceptional_rationale: string | null
  ingest_status: string
  linkedin_url: string | null
  resume_path: string | null
  enrichment: Enrichment | null
  enriched_at: string | null
  confirmed_at: string | null
  created_at: string
  similarity?: number
  reason?: string
  rank?: number
}

interface Enrichment {
  findings?: string[]
  confirmed_claims?: string[]
  links?: { title: string; url: string }[]
  notable?: string
}

type Mode = "semantic" | "ai"
type Sort = "score" | "recent"

export function AdminDashboard({ initial }: { initial: Candidate[] }) {
  const [list, setList] = useState<Candidate[]>(initial)
  const [query, setQuery] = useState("")
  const [mode, setMode] = useState<Mode>("semantic")
  const [sort, setSort] = useState<Sort>("score")
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  function resort(next: Sort) {
    setSort(next)
    setList((prev) =>
      [...prev].sort((a, b) =>
        next === "score"
          ? (b.exceptional_score ?? -1) - (a.exceptional_score ?? -1)
          : +new Date(b.confirmed_at ?? b.created_at) -
            +new Date(a.confirmed_at ?? a.created_at)
      )
    )
  }

  async function runSearch(e?: React.FormEvent) {
    e?.preventDefault()
    const q = query.trim()
    if (!q) {
      setList(initial)
      setSearched(false)
      return
    }
    setSearching(true)
    setSearchError(null)
    try {
      const res = await fetch("/api/admin/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, mode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSearchError(data.error ?? "Search failed.")
        return
      }
      setList(data.results ?? [])
      setSearched(true)
    } catch {
      setSearchError("Network error. Try again.")
    } finally {
      setSearching(false)
    }
  }

  function clearSearch() {
    setQuery("")
    setList(initial)
    setSearched(false)
    setSearchError(null)
  }

  function removeFromList(id: string) {
    setList((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div className="mt-8">
      {/* Search */}
      <form onSubmit={runSearch} className="space-y-3">
        <div>
          <label htmlFor="admin-search" className="label">
            Search community
          </label>
          <input
            id="admin-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              mode === "ai"
                ? "Technical founder who can build agent infrastructure"
                : "AI infrastructure, Stanford, robotics"
            }
            className="mt-2 w-full rounded-lg border border-hairline bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-faint focus:border-accent/50"
          />
          <p className="mt-2 text-xs leading-relaxed text-faint">
            Semantic search is vector-only. AI match ranks a short vector shortlist.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Toggle active={mode === "semantic"} onClick={() => setMode("semantic")}>
            Semantic
          </Toggle>
          <Toggle active={mode === "ai"} onClick={() => setMode("ai")}>
            AI match
          </Toggle>
          <button
            type="submit"
            disabled={searching}
            className="rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-50"
          >
            {searching ? "Searching" : "Search"}
          </button>
        </div>
      </form>
      {searchError && <p className="mt-3 text-sm text-red-400">{searchError}</p>}

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-faint">
          {searched ? `${list.length} result${list.length === 1 ? "" : "s"}` : `${list.length} confirmed`}
          {searched && mode === "ai" && " ranked by AI"}
        </span>
        {searched ? (
          <button onClick={clearSearch} className="label hover:text-muted">
            Clear
          </button>
        ) : (
          <div className="flex gap-2">
            <Toggle small active={sort === "score"} onClick={() => resort("score")}>
              Score
            </Toggle>
            <Toggle small active={sort === "recent"} onClick={() => resort("recent")}>
              Recent
            </Toggle>
          </div>
        )}
      </div>

      {/* List */}
      <ul className="mt-5 space-y-3">
        {list.length === 0 && (
          <li className="rounded-xl border border-hairline bg-[#080809] px-5 py-10 text-center text-sm text-faint">
            {searched ? "No matches." : "No confirmed candidates yet."}
          </li>
        )}
        {list.map((c) => (
          <CandidateCard
            key={c.id}
            c={c}
            open={openId === c.id}
            onToggle={() => setOpenId(openId === c.id ? null : c.id)}
            onRemove={() => removeFromList(c.id)}
          />
        ))}
      </ul>
    </div>
  )
}

function Toggle({
  active,
  small,
  onClick,
  children,
}: {
  active: boolean
  small?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border font-mono uppercase tracking-[0.15em] transition-colors",
        small ? "px-2.5 py-1 text-[0.6rem]" : "px-3 py-2 text-[0.65rem]",
        active
          ? "border-accent/50 bg-accent/10 text-foreground"
          : "border-hairline text-faint hover:text-muted"
      )}
    >
      {children}
    </button>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-hairline px-2.5 py-0.5 text-[0.7rem] text-muted">
      {children}
    </span>
  )
}

function ScoreBadge({ score }: { score: number | null }) {
  const v = score ?? 0
  const tone = v >= 85 ? "text-accent" : v >= 65 ? "text-foreground" : "text-faint"
  return (
    <div className={cn("text-right font-mono", tone)}>
      <div className="text-lg leading-none">{score ?? "N/A"}</div>
      <div className="text-[0.55rem] uppercase tracking-[0.2em] text-faint">signal</div>
    </div>
  )
}

function CandidateCard({
  c,
  open,
  onToggle,
  onRemove,
}: {
  c: Candidate
  open: boolean
  onToggle: () => void
  onRemove: () => void
}) {
  const tags = c.ai_tags ?? {}
  return (
    <li className="overflow-hidden rounded-xl border border-hairline bg-[#080809]">
      <button onClick={onToggle} className="flex w-full items-start gap-4 px-5 py-4 text-left">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h3 className="truncate font-medium text-foreground">{c.full_name}</h3>
            {c.rank && <span className="label text-accent/70">#{c.rank}</span>}
            {typeof c.similarity === "number" && (
              <span className="label">{Math.round(c.similarity * 100)}% match</span>
            )}
            {c.ingest_status !== "done" && (
              <span className="label text-amber-500/70">{c.ingest_status}</span>
            )}
          </div>
          {c.reason && <p className="mt-1 text-xs italic text-accent/80">{c.reason}</p>}
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
            {c.ai_summary ?? "Awaiting analysis"}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {tags.seniority && <Chip>{tags.seniority}</Chip>}
            {(tags.domains ?? []).slice(0, 3).map((d) => (
              <Chip key={d}>{d}</Chip>
            ))}
          </div>
        </div>
        <ScoreBadge score={c.exceptional_score} />
      </button>

      {open && <CandidateDetail c={c} onRemove={onRemove} />}
    </li>
  )
}

function CandidateDetail({ c, onRemove }: { c: Candidate; onRemove: () => void }) {
  const tags = c.ai_tags ?? {}
  const [enrichment, setEnrichment] = useState<Enrichment | null>(c.enrichment)
  const [enriching, setEnriching] = useState(false)
  const [similar, setSimilar] = useState<Candidate[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [contactOpen, setContactOpen] = useState(false)

  async function post(path: string, body: object) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    return res.json().then((d) => ({ ok: res.ok, ...d }))
  }

  async function enrich() {
    setEnriching(true)
    const r = await post("/api/admin/enrich", { candidateId: c.id })
    if (r.ok) setEnrichment(r.enrichment)
    else alert(r.error ?? "Enrichment failed.")
    setEnriching(false)
  }

  async function findSimilar() {
    setBusy("similar")
    const r = await post("/api/admin/similar", { candidateId: c.id })
    setSimilar(r.results ?? [])
    setBusy(null)
  }

  async function viewResume() {
    setBusy("resume")
    const r = await post("/api/admin/resume", { candidateId: c.id })
    setBusy(null)
    if (r.url) window.open(r.url, "_blank", "noopener")
    else alert(r.error ?? "No résumé.")
  }

  async function del() {
    if (!confirm(`Permanently delete ${c.full_name}? This removes their profile and résumé.`)) return
    setBusy("delete")
    const r = await post("/api/admin/delete", { candidateId: c.id })
    setBusy(null)
    if (r.ok) onRemove()
    else alert(r.error ?? "Delete failed.")
  }

  return (
    <div className="border-t border-hairline px-5 py-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label>Why they&apos;re exceptional</Label>
          {c.exceptional_rationale && (
            <p className="mt-2 text-sm leading-relaxed text-muted">{c.exceptional_rationale}</p>
          )}
          {(tags.signals ?? []).length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {tags.signals!.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-foreground">
                  <span className="text-accent">-</span>
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <Label>Skills</Label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(tags.skills ?? []).map((s) => (
              <Chip key={s}>{s}</Chip>
            ))}
            {(tags.skills ?? []).length === 0 && (
              <span className="text-sm text-faint">No skills extracted yet.</span>
            )}
          </div>
        </div>
      </div>

      {/* Enrichment */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <Label>Web enrichment</Label>
          <button
            onClick={enrich}
            disabled={enriching}
            className="label text-accent/80 hover:text-accent disabled:opacity-50"
          >
            {enriching ? "Researching" : enrichment ? "Refresh" : "Enrich from web"}
          </button>
        </div>
        {enrichment ? (
          <div className="mt-3 space-y-2">
            {enrichment.notable && <p className="text-sm text-foreground">{enrichment.notable}</p>}
            <ul className="space-y-1">
              {(enrichment.findings ?? []).map((f, i) => (
                <li key={i} className="text-sm leading-relaxed text-muted">
                  - {f}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3 pt-1">
              {(enrichment.links ?? []).map((l, i) => (
                <a
                  key={i}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-xs text-accent/70 underline hover:text-accent"
                >
                  {l.title}
                </a>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-faint">No web research yet.</p>
        )}
      </div>

      {/* Similar */}
      {similar && (
        <div className="mt-5">
          <Label>Similar people</Label>
          <ul className="mt-2 space-y-1">
            {similar.length === 0 && <li className="text-sm text-faint">None found.</li>}
            {similar.map((s) => (
              <li key={s.id} className="flex justify-between text-sm text-muted">
                <span>{s.full_name}</span>
                <span className="font-mono text-faint">{s.exceptional_score ?? "N/A"}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Contact composer */}
      {contactOpen && <ContactComposer c={c} onClose={() => setContactOpen(false)} />}

      {/* Actions */}
      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-hairline pt-4">
        <Action onClick={() => setContactOpen((v) => !v)}>Contact</Action>
        <Action onClick={findSimilar} loading={busy === "similar"}>Find similar</Action>
        {c.resume_path && (
          <Action onClick={viewResume} loading={busy === "resume"}>Résumé</Action>
        )}
        {c.linkedin_url && (
          <a
            href={c.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className={actionCls}
          >
            LinkedIn
          </a>
        )}
        <span className="ml-auto text-xs text-faint">{c.email}</span>
        <Action onClick={del} loading={busy === "delete"} danger>Delete</Action>
      </div>
    </div>
  )
}

function ContactComposer({ c, onClose }: { c: Candidate; onClose: () => void }) {
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [drafting, setDrafting] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function draft() {
    setDrafting(true)
    setError(null)
    const res = await fetch("/api/admin/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId: c.id }),
    })
    const d = await res.json()
    if (res.ok) {
      setSubject(d.subject ?? "")
      setBody(d.body ?? "")
    } else setError(d.error ?? "Draft failed.")
    setDrafting(false)
  }

  async function send() {
    if (!subject.trim() || !body.trim()) return setError("Subject and message required.")
    setSending(true)
    setError(null)
    const res = await fetch("/api/admin/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId: c.id, subject, body }),
    })
    const d = await res.json()
    if (res.ok) setSent(true)
    else setError(d.error ?? "Send failed.")
    setSending(false)
  }

  if (sent)
    return (
      <div className="mt-5 rounded-lg border border-accent/30 bg-[#060606] p-4 text-sm text-muted">
        Email sent to {c.email}.{" "}
        <button onClick={onClose} className="text-accent/80 underline">Close</button>
      </div>
    )

  return (
    <div className="mt-5 space-y-3 rounded-lg border border-hairline bg-[#060606] p-4">
      <div className="flex items-center justify-between">
        <Label>Outreach to {c.full_name}</Label>
        <button onClick={draft} disabled={drafting} className="label text-accent/80 hover:text-accent disabled:opacity-50">
          {drafting ? "Drafting" : "Draft"}
        </button>
      </div>
      <div>
        <label htmlFor={`subject-${c.id}`} className="label">
          Subject
        </label>
        <input
          id={`subject-${c.id}`}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="mt-2 w-full rounded-lg border border-hairline bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-faint focus:border-accent/50"
        />
      </div>
      <div>
        <label htmlFor={`body-${c.id}`} className="label">
          Message
        </label>
        <textarea
          id={`body-${c.id}`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          className="mt-2 w-full resize-none rounded-lg border border-hairline bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-faint focus:border-accent/50"
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="label hover:text-muted">Cancel</button>
        <button
          onClick={send}
          disabled={sending}
          className="rounded-full bg-foreground px-5 py-2 text-xs font-semibold text-background disabled:opacity-50"
        >
          {sending ? "Sending" : "Send"}
        </button>
      </div>
    </div>
  )
}

const actionCls =
  "rounded-lg border border-hairline px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-muted transition-colors hover:border-accent/40 hover:text-foreground"

function Action({
  onClick,
  children,
  loading,
  danger,
}: {
  onClick: () => void
  children: React.ReactNode
  loading?: boolean
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(actionCls, danger && "hover:border-red-500/40 hover:text-red-400", "disabled:opacity-50")}
    >
      {loading ? "Working" : children}
    </button>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="label">{children}</span>
}
