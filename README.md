# Quanta Talent

A landing page + backend for an elite venture talent community — the people who
have reached the **top 0.01%** of a field, and the scouts who find them. Visitors
request to join, confirm by email, and are analyzed by AI on the way in. A gated
admin dashboard lets the venture team search, enrich, and reach out.

Deployment target: **https://quantatalent.vercel.app**

> Full product vision and the complete instruction history live in
> [`docs/PROJECT.md`](docs/PROJECT.md). Progress log: [`docs/diary.md`](docs/diary.md).
> Gotchas: [`docs/lessons.md`](docs/lessons.md).

---

## Stack

- **Next.js 16** (App Router, React Server Components, Server Actions) · **React 19** · **Tailwind v4** · **TypeScript**
- **Supabase** (Postgres 17 + pgvector + private Storage) — "Quanta DB"
- **OpenAI** — `gpt-4o-mini` (analysis/ranking/enrichment) + `text-embedding-3-small` (vectors)
- **Resend** — confirmation + outreach email
- **Brave Search** — web enrichment
- **Vercel** — hosting + Cron

## How it works

### 1. Request to join (`/`)
The landing page renders the animated Q (the live Quanta mark cloned as a CSS
mask over a moving gradient with an orbiting magenta glow) and the floating
venture partners. The join modal collects **name, email, blurb, optional
LinkedIn, optional résumé**. As you attach a PDF it's parsed instantly for a
free "we read you as…" preview.

`POST /api/join`:
1. Validates input (zod) and checks a **honeypot** field.
2. **Rate-limits** per IP and per email (Postgres fixed-window).
3. Uploads any résumé to a **private** bucket and extracts its text.
4. Upserts the candidate as `pending`, stores a **hashed**, single-use,
   24-hour confirmation token, and emails the raw link via Resend.
5. **Ingests immediately** (`after()`): one capped LLM call produces a summary,
   tags, and an **exceptional-signal score (0–100)** with rationale; one
   embedding call powers semantic search. Data is ready before confirmation —
   but never exposed until then.

Responses are uniform to prevent **email enumeration**.

### 2. Confirm (`/confirm?token=…`)
The token is hashed and compared in constant time; if valid and unexpired the
candidate flips to `confirmed`. The page shows a personalized **AI read-back**
("How we read you" + signal score). Only `confirmed` candidates ever appear in
the dashboard.

### 3. Admin dashboard (`/admin`)
Gated by **Supabase magic-link** auth restricted to the `ADMIN_EMAILS`
allowlist. Features:
- Ranked list (by signal score) with AI summaries; click to expand.
- **Semantic search** (one embedding + pgvector cosine — essentially free).
- **AI role-match**: vector shortlist → one cheap ranking call over compact
  summaries → top picks with a one-line "why". Token cost is ~constant.
- Per-candidate: **web enrichment** (Brave + SSRF-guarded scrape + LLM, cached),
  **find similar** (vector neighbors), **AI-drafted outreach** sent via Resend,
  résumé download (signed URL), LinkedIn, **delete** (GDPR). All actions audited.

### 4. Retention
A Vercel Cron hits `GET /api/cron/purge` daily (Bearer `CRON_SECRET`) to delete
unconfirmed signups older than 14 days plus their résumés.

## Security

- **Server-only Data Access Layer** using the service-role key; the public key
  never touches candidate tables. **RLS is on with no policies** (deny-all) as
  defense in depth. `server-only` import guards prevent client leakage.
- Hashed/expiring/single-use tokens; honeypot; per-IP + per-email rate limits.
- Résumé type/size validation (PDF/Word ≤5 MB); private storage.
- **SSRF protection** on enrichment fetches (blocks localhost, private/CGNAT/
  link-local ranges and the cloud metadata IP; http(s) + content-type + size caps).
- Privacy policy + data-deletion path.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in the secrets (see below)
npm run dev                  # http://localhost:3000
```

### Required environment

See [`.env.example`](.env.example). The keys you must supply yourself:

| Variable | Where to get it |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API keys (not exposed via tooling) |
| `OPENAI_API_KEY` | platform.openai.com |
| `RESEND_API_KEY` | resend.com (testing domain works for your own inbox) |
| `BRAVE_SEARCH_API_KEY` | brave.com/search/api (free tier) |
| `ADMIN_EMAILS` | your admin email(s), comma-separated |
| `CRON_SECRET` | any random string |

### Supabase Auth setup (for admin login)
In the Supabase dashboard → **Authentication → URL Configuration**, set the
Site URL and add redirect URLs:
- `http://localhost:3000/**`
- `https://quantatalent.vercel.app/**`

The database schema (tables, RLS, pgvector RPC, storage bucket) is already
applied to Quanta DB via migrations.

## Deployment

Target Vercel team: **Cooper's projects**. Set every variable from
`.env.example` in the Vercel project's Environment Variables, then deploy.
`vercel.json` registers the daily purge cron.

## Project layout

```
app/
  page.tsx               landing (hero Q, partners, editorial, footer)
  confirm/               email-confirmation page (personalized read-back)
  privacy/               privacy policy
  admin/                 login, magic-link callback, dashboard
  api/                   join, parse-resume, admin/*, cron/purge
components/site/         q-mark, partners, join-dialog, cursor-glow, reveal
components/admin/        dashboard
lib/                     env, supabase clients, dal, ingest, search, enrich,
                         email, crypto, rate-limit, validation, partners
public/q-mask.svg        the exact Q outline used as a CSS mask
```
