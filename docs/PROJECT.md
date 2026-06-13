# Quanta Talent — Project Vision & Instructions

> The single source of truth for what we're building and why. Compiled from
> the take-home brief, the interviewer's stated goals, and every refinement
> given during the build. Living document — update as scope changes.
> Companion docs: [`README.md`](../README.md) (how it works), [`diary.md`](./diary.md)
> (chronological progress), [`lessons.md`](./lessons.md) (gotchas learned).

---

## 1. The goal

Build and deploy a functional landing page + backend for an elite venture
talent community. The mission, in the interviewer's words: build **the world's
best community of exceptional people** — people who have proven the ability to
reach the **top 0.01% of a field**. The community is meant to surface:

1. **Future founders**
2. **Potential venture scouts**
3. **Generally exceptional operators**

The product is a scouting/intelligence tool for a venture firm (Quanta). The
deliverable should "wow" — clean, classy, tasteful — and show off engineering
and product range.

Deployment target: **`quantatalent.vercel.app`** under **Cooper's projects**
(Vercel team `team_Mb1NYVWemYdfwasn6zQATd5w`).

---

## 2. Core requirements (from the brief)

- **Landing page**: black background, extremely minimal, with a "Q" animation
  similar to quantaventures.ai, and **venture partners floating** on top with
  **transparent-background** portraits. Hovering a partner enlarges them and
  reveals bullet-point bio facts. A "wow" animation that stays clean and
  understated.
- **Request to join** flow: a visitor submits a request; they receive an email
  to **confirm their address**, and click a link in the email to confirm.
- **Backend**: store submissions; only **confirmed** people are exposed.
- **Admin dashboard** (gated): browse/search the community; per-person an
  **AI-generated summary** done during ingestion; click to expand for detail.
- **AI resume analysis**, **AI search** for finding the best person for a role,
  and **web enrichment** (search + scrape + LLM) — all **rate limited**.
- Handle **edge cases** and **security vulnerabilities**. Include a **privacy
  policy**.
- Track progress in **diary.md** + **lessons.md**; write a **README**.

## 3. Expanded requirements (added during planning)

- The join form collects more than email: **full name**, a **short blurb**
  (why they're exceptional + why they want in), an **optional résumé**, and an
  **optional LinkedIn URL**.
- Backend is **Supabase** ("Quanta DB" in the "Quanta" org). Candidate info is
  **vectorized** (pgvector) to enable fast semantic filtering.
- Admin dashboard: default view is a **list** with an AI summary per person;
  **expand** for more. People appear **only after email confirmation**.
- **Resend** integration to contact candidates from the dashboard.
- Search: default **vector search**, plus an **LLM (GPT) role-match** ("find me
  a founder who can build X…") designed to be **cheap / low-token**.
- **Web enrichment beta** feature (Brave Search + safe public-page fetching +
  LLM entity matching), rate limited.
- Above-and-beyond welcome.

## 4. Decisions locked during planning

| Area | Decision |
|---|---|
| LLM provider | **OpenAI / GPT** — `gpt-4o-mini` for summary/ranking/enrichment, `text-embedding-3-small` (1536-dim) for vectors. |
| Admin auth | **Username/password** backed by env vars and an HTTP-only signed session cookie. Demo credentials: `user` / `quanta123`. |
| Anti-abuse | **Lightweight, no extra accounts**: honeypot field + Postgres-backed per-IP/per-email fixed-window rate limiting. |
| Partner portraits | **Temporary placeholders** per person (elegant silhouettes), driven by a config array; real transparent PNGs to be dropped in later. |
| Ingestion timing | **Ingest immediately on signup** (analyze + embed at submit time) but **expose only after email confirmation**. No cold-start when an admin opens a freshly confirmed profile. |
| Three-category auto-bucketing (founder/scout/operator) | **Cut** — explicitly removed at the user's request. |
| Email sending | **Resend testing domain** (`onboarding@resend.dev`) for now — only delivers to the Resend account's own address until a domain is verified. If no key is set, the confirm link is logged for local testing. |
| The "Q" | **Exact clone** of quantaventures.ai: the real path data used as a CSS **mask** over a moving blue gradient; a large **magenta glow orbits an oval path** so its coverage of the ring swells (~40%) and recedes; **large** like the live site; **cyan cast** on the handle; plus the **ambient hero glow** from the reference PDF (teal lens glow + corner wash). |

## 5. Architecture & stack

```
Next.js 16 (App Router, RSC, Server Actions) · React 19 · Tailwind v4 · TypeScript
Supabase (Quanta DB): Postgres 17 + pgvector + private Storage (résumés)
OpenAI: gpt-4o-mini (analysis/ranking/enrichment) + text-embedding-3-small (vectors)
Resend: confirmation + admin outreach email
Brave Search API: web enrichment
Vercel: hosting + Cron (daily purge of unconfirmed signups)
```

**Security posture (server-only Data Access Layer):** all candidate PII is read
and written **server-side using the Supabase service-role key**. The public
anon/publishable key never touches candidate tables. **RLS is enabled with no
policies** → anon/authenticated are denied at the row level (defense in depth);
the service role bypasses RLS. Admin reads happen only after the request has a
valid signed admin session cookie.

## 6. Data model (Supabase `public`)

- **candidates** — email (citext, unique), full_name, blurb, linkedin_url,
  resume_path, resume_text, `status` (`pending`|`confirmed`), confirmed_at,
  `ai_summary`, `ai_tags` (jsonb: domains/skills/seniority/signals),
  `exceptional_score` (0–100), `exceptional_rationale`, `ingest_status`,
  `embedding vector(1536)`, `enrichment` (jsonb), enriched_at, signup_ip,
  signup_user_agent, deletion_requested_at, timestamps.
- **confirmation_tokens** — candidate_id, **token_hash** (sha256; raw token only
  ever emailed), expires_at, used_at.
- **rate_limits** — (bucket, window_start) → count; atomic via `bump_rate_limit`.
- **email_events** — confirmation and outreach email send log.
- **admin_audit** — every admin action.
- **saved_roles** — admin-defined roles (+embedding) for future auto-matching.
- RPC **match_candidates(query_embedding, match_count)** — cosine search over
  confirmed candidates (returns id + similarity; DAL hydrates display columns,
  keeping the embedding off the wire).

## 7. Feature set

**Landing**
- Cloned animated Q (mask + moving gradient + orbiting magenta glow + hero glow).
- Cursor-trailing spotlight; scroll-reveal sections.
- Floating venture partners arc; hover/focus enlarges one, dims others, shows
  3 bullets (name / location / company / sector). Driven by `lib/partners.ts`.
- Editorial sections matching the reference (pipeline 01–05, faint Q watermark).
- Multi-field join modal with résumé dropzone + **instant, free extraction
  read-back** ("Read you as: …"), honeypot, client+server validation.
- Privacy policy page.

**Join → confirm pipeline**
- `POST /api/join`: validate (zod), honeypot, rate-limit (IP + email), optional
  résumé upload to private bucket + text extraction, upsert candidate as
  `pending`, hash+store a fresh confirmation token, email the raw link,
  **ingest immediately** via `after()`. Generic response (no email enumeration).
- `/confirm?token=…`: single-use, time-limited (24h), hash-compared; flips to
  `confirmed`; shows a **personalized AI read-back** of the candidate.

**Admin dashboard** (`/admin`, username/password gated)
- Stat strip (confirmed count, avg signal, enriched count).
- List of confirmed candidates sorted by exceptional score; expand for detail.
- **Semantic search** (vector, ~free) and **AI role-match** (two-stage:
  vector shortlist → one cheap ranking call → top picks with a one-line "why").
- Per-candidate: résumé download (signed URL), LinkedIn, **web enrichment beta**
  (Brave + SSRF-guarded scrape + LLM entity matching, cached), **find similar**
  (vector neighbors), **AI-drafted outreach** + send via Resend, and candidate
  deletion with résumé cleanup.
- Every action audit-logged.

**Jobs**
- Vercel Cron daily → `/api/cron/purge` (CRON_SECRET-guarded): delete
  unconfirmed signups older than 14 days + their résumé files.

## 8. Cost control (the "cheap" mandate)

- Ingestion = **one** capped chat completion (JSON) + **one** embedding.
- Default search = **one** embedding + a Postgres cosine query (no generation).
- AI role-match = vector shortlist (≤15) → **one** ranking call over **compact
  summaries only** (never résumé text). Token cost is ~constant regardless of
  community size.
- Enrichment is **cached** on the row (one-time) and hard rate-limited.

## 9. Security & edge cases handled

- Service-role-only DAL; RLS deny-all; `server-only` import guards.
- Hashed, single-use, expiring confirmation tokens; constant-time compare.
- Email-enumeration-safe responses; honeypot; per-IP + per-email rate limits.
- Résumé type/size validation (PDF/Word, ≤5 MB); private storage bucket.
- SSRF guard on enrichment fetches (blocks localhost, private/CGNAT/link-local
  ranges, cloud metadata IP; http(s) + content-type + size caps).
- Function `search_path` pinned; advisors checked.
- Admin deletion endpoint + retention purge + privacy policy.

## 10. Environment configuration

See [`.env.example`](../.env.example). Secrets I cannot self-provision:
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase dashboard (not exposed via MCP).
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — currently `user` / `quanta123` for demo.
- `ADMIN_SESSION_SECRET` — random cookie-signing secret (falls back to
  `CRON_SECRET` if unset).
- `CRON_SECRET` — any random string (also used by Vercel Cron).
Provided by the user: `OPENAI_API_KEY`, `RESEND_API_KEY`, `BRAVE_SEARCH_API_KEY`.
Public/known: Supabase URL + publishable key, `NEXT_PUBLIC_SITE_URL`.

## 11. "Go above and beyond" — shipped + candidate ideas

**Shipped beyond the brief:** exceptional-signal score with rationale,
provenance-minded signal extraction, instant résumé read-back, personalized
confirmation page, two-stage low-token AI role-match, find-similar, AI-drafted
outreach, audit log, candidate delete + retention purge, SSRF protection, documented
cost model.

**Easy future adds (not yet built):** command palette with streaming search,
saved-role auto-matching feed, side-by-side compare, email delivery/reply
webhooks, analytics charts, and a small test suite on the security-critical
paths.

## 12. Status / remaining

- [x] Schema + RLS + RPC + storage (Supabase, applied)
- [x] Server lib layer (DAL, ingest, search, enrich, email, crypto, rate-limit)
- [x] Landing page + cloned Q + hero glow + partners + join modal
- [x] Confirm flow + personalized read-back
- [x] Privacy policy
- [x] Admin auth (username/password + signed cookie) + API routes
- [x] Admin dashboard UI
- [x] README, diary.md, lessons.md, .env.example
- [x] Local end-to-end verification
- [ ] Deploy to Vercel + set env

Audit note (June 13, 2026): the Vercel connector can see **Cooper's projects**
(`team_Mb1NYVWemYdfwasn6zQATd5w`) but currently lists no Vercel projects there,
so `quantatalent.vercel.app` still needs to be created/deployed. The Supabase
management connector cannot access Quanta DB (`dkabdrrpwsgxgfkwljcq`), but the
local service-role environment can reach it and verified the expected tables,
private `resumes` bucket, rate-limit RPC, and anon-key RLS denial.
