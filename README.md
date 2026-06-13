# Quanta Talent

Quanta Talent is a Next.js project built for Quata Ventures as a way to find and analyze extremely talented people.

Deployment target: [https://quantatalent.vercel.app](https://quantatalent.vercel.app)

Related docs:
- [Project brief and architecture](docs/PROJECT.md)
- [Build diary](docs/diary.md)
- [Lessons and gotchas](docs/lessons.md)
- [Deployment checklist](docs/DEPLOY.md)

## What It Does

- Minimal Quanta-style landing page with a cool-white intro wipe, animated Q
  mark, floating venture partner profiles, and a request-to-join modal.
- Join form collects full name, email, short application blurb, optional
  LinkedIn URL, and optional resume.
- PDF resumes can be previewed in the form before submission.
- Email confirmation gates visibility. Pending candidates are never shown to
  the venture team dashboard.
- AI ingestion creates a concise profile summary, tags, concrete exceptional
  signals, an exceptional score, and an embedding for search.
- Admin dashboard supports semantic search, AI role matching, similar-candidate
  search, resume download, outreach drafting/sending, deletion, and web
  enrichment beta.
- Generated social preview assets, icons, manifest, robots, and sitemap are
  included for production polish.

## Stack

- Next.js 16 App Router, React 19, TypeScript, Tailwind v4
- Supabase Postgres with pgvector and private Storage
- OpenAI for profile analysis, search ranking, outreach drafting, and embeddings
- Resend for confirmation and outreach email
- Brave Search for web enrichment beta
- Vercel hosting and Vercel Cron

## App Flow

### 1. Landing Page

Route: `/`

The homepage presents the Quanta visual system: black background, animated Q,
partner/scout profile motion, and a compact request-to-join flow. The join modal
validates name, email, blurb, LinkedIn, and resume fields on the client and
server.

### 2. Resume Preview

Route: `POST /api/parse-resume`

If the applicant drops in a PDF resume, the app extracts text and returns a
short "read you as" preview. This endpoint is rate limited and does not create a
candidate record by itself.

### 3. Request To Join

Route: `POST /api/join`

The join endpoint:
- validates fields with `zod`
- checks a honeypot field
- rate limits by IP and email
- uploads an optional resume to private Supabase Storage
- extracts resume text when possible
- creates or refreshes a pending candidate row
- creates a single-use 24 hour confirmation token
- sends the confirmation email
- starts AI ingestion after the response

If an email is already confirmed, the user is told they are already in the
talent community. Other responses stay intentionally generic where needed to
avoid leaking account state.

### 4. Email Confirmation

Route: `/confirm?token=...`

Confirmation tokens are hashed in storage, single-use, and time limited. A valid
token marks the candidate as confirmed and shows a personalized read-back of the
AI summary and score. Re-clicking a used token for an already confirmed person
shows an idempotent success state.

### 5. Admin Dashboard

Routes: `/admin`, `/admin/login`

Admin access uses an environment-configured username/password and an HTTP-only
signed session cookie. The dashboard only lists confirmed candidates.

Dashboard features:
- sort by signal score or recency
- semantic search: one embedding plus pgvector cosine search
- AI match: semantic shortlist plus one low-token ranking call
- expandable candidate profile cards
- web enrichment beta
- similar people search
- AI-drafted outreach email
- direct outreach via Resend
- short-lived signed resume links
- candidate deletion with resume cleanup

### 6. Web Enrichment Beta

Route: `POST /api/admin/enrich`

Web enrichment is admin-triggered and rate limited. It searches Brave, fetches a
small number of public pages through SSRF-guarded fetch logic, then asks the LLM
to do entity matching before extracting findings. The model is told to be
especially conservative for common names.

Only source links the LLM marks as plausibly matching the candidate are stored.
Admins should still treat enrichment as review material, not ground truth.

### 7. Retention Job

Route: `GET /api/cron/purge`

Vercel Cron calls this endpoint daily with `CRON_SECRET`. It deletes pending
unconfirmed signups older than 14 days and removes their resume files.

## API Routes

| Route | Purpose | Auth |
|---|---|---|
| `POST /api/join` | Create or refresh a pending candidate and send confirmation | Public, rate limited |
| `POST /api/parse-resume` | Extract PDF resume text for form preview | Public, rate limited |
| `GET /api/cron/purge` | Delete stale unconfirmed signups | Bearer `CRON_SECRET` |
| `POST /api/admin/search` | Semantic search or AI role match | Admin |
| `POST /api/admin/similar` | Find vector-neighbor candidates | Admin |
| `POST /api/admin/enrich` | Run web enrichment beta | Admin |
| `POST /api/admin/draft` | Draft outreach copy | Admin |
| `POST /api/admin/contact` | Send outreach email | Admin |
| `POST /api/admin/resume` | Mint signed resume download URL | Admin |
| `POST /api/admin/delete` | Delete candidate and stored resume files | Admin |

## Data Model

The app expects the connected Supabase project, Quanta DB, to have the schema
described in [docs/PROJECT.md](docs/PROJECT.md). The important tables are:

- `candidates`: applicant profile, status, resume path/text, AI analysis,
  embedding, enrichment, signup metadata, timestamps
- `confirmation_tokens`: hashed confirmation tokens with expiry and used state
- `rate_limits`: fixed-window counters
- `email_events`: confirmation/outreach email send logs
- `admin_audit`: admin action log
- `saved_roles`: reserved for role-based matching extensions

The candidate table uses pgvector embeddings. Dashboard queries hydrate display
columns only; raw embeddings and resume text are not sent to the client list.

## Environment Variables

Copy `.env.example` to `.env.local` for local development.

```bash
cp .env.example .env.local
```

Required for a full demo:

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key from Supabase dashboard |
| `OPENAI_API_KEY` | Required for ingestion, search ranking, drafts, embeddings |
| `RESEND_API_KEY` | Required to actually send confirmation/outreach email |
| `BRAVE_SEARCH_API_KEY` | Required for web enrichment beta |
| `ADMIN_USERNAME` | Admin login username |
| `ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH` | Admin login secret |
| `ADMIN_SESSION_SECRET` | Cookie signing secret; falls back if unset |
| `CRON_SECRET` | Secret for the purge cron endpoint |
| `NEXT_PUBLIC_SITE_URL` | Used for confirmation links and metadata |

Optional or fallback behavior:
- If `RESEND_API_KEY` is missing, confirmation links are logged server-side for
  local testing.
- If `BRAVE_SEARCH_API_KEY` is missing, web enrichment beta will return a clear
  configuration error.
- `EMAIL_FROM` defaults to `Quanta Talent <onboarding@resend.dev>`.
- `OPENAI_CHAT_MODEL` defaults in code if unset.

The `.env.example` file includes local demo admin values. Replace them before
any real deployment.

## Local Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Run verification:

```bash
npm run lint
./node_modules/.bin/tsc --noEmit
npm run build
```

## Demo Checklist

1. Visit `/` and open the request modal.
2. Submit name, email, blurb, optional LinkedIn, and optional resume.
3. Confirm the email link. Locally, if Resend is not configured, use the link
   printed in the dev server logs.
4. Visit `/admin/login`.
5. Sign in with the configured admin credentials.
6. Review the confirmed candidate list.
7. Try semantic search, AI match, similar people, resume download, web
   enrichment beta, and outreach drafting.

## Deployment

Target Vercel team: Cooper's projects.

1. Create or link the Vercel project for `quantatalent.vercel.app`.
2. Set every production environment variable from `.env.example`.
3. Use real admin credentials and prefer `ADMIN_PASSWORD_HASH` over a plain
   password.
4. Set `NEXT_PUBLIC_SITE_URL=https://quantatalent.vercel.app`.
5. Verify Resend sender/domain settings so confirmation email can deliver.
6. Deploy.
7. Run a real join-confirm-admin smoke test.

`vercel.json` registers the daily purge cron:

```json
{
  "crons": [{ "path": "/api/cron/purge", "schedule": "0 4 * * *" }]
}
```

## Security Notes

- Candidate reads/writes happen server-side through a service-role data layer.
- Public users cannot browse candidate data.
- The admin dashboard requires a signed HTTP-only session cookie.
- Admin login, join, search, enrichment, drafting, contact, and similar-search
  paths are rate limited.
- Confirmation tokens are hashed, single-use, and expire after 24 hours.
- Resumes are stored privately and exposed to admins only through short-lived
  signed URLs.
- Enrichment fetches block localhost, private IP ranges, link-local addresses,
  and cloud metadata IPs; responses are content-type and size capped.
- LLM prompts wrap applicant, resume, search, web, and prior model content as
  untrusted data and sanitize model output before storing/displaying it.

## Project Layout

```text
app/
  page.tsx                 landing page
  confirm/                 email confirmation result page
  privacy/                 applicant-facing privacy policy
  admin/                   login, logout action, dashboard page
  api/                     join, resume preview, admin APIs, cron purge
  opengraph-image.tsx      generated social preview card
  twitter-image.tsx        generated X/Twitter preview card
  icon.tsx                 generated app icon
  apple-icon.tsx           generated Apple icon
  manifest.ts              web app manifest
  robots.ts                robots.txt
  sitemap.ts               sitemap.xml

components/
  site/                    Q mark, partners, join modal, reveal effects
  admin/                   dashboard UI

lib/
  admin-*                  admin auth/session helpers
  supabase/                Supabase server client
  dal.ts                   server-only data access layer
  ingest.ts                AI analysis and embedding pipeline
  search.ts                semantic search and AI role match
  enrich.ts                web enrichment beta
  brave.ts                 Brave search and safe public page fetching
  email.ts                 confirmation and outreach email
  rate-limit.ts            Postgres-backed fixed-window limiter
  validation.ts            join form validation
  llm-safety.ts            prompt-injection guard helpers

docs/
  PROJECT.md               fuller product/architecture notes
  DEPLOY.md                deployment checklist
  diary.md                 chronological build log
  lessons.md               implementation gotchas
```

## Troubleshooting

- `Missing required environment variable`: fill `.env.local` or Vercel env vars.
- Confirmation email does not arrive: check `RESEND_API_KEY`, sender/domain
  verification, and server logs. With no key, the link is printed in logs.
- Candidate does not appear in admin: make sure the confirmation link was
  clicked and the candidate status is `confirmed`.
- AI summary/search is missing: check `OPENAI_API_KEY`; ingestion marks failures
  in `ingest_status`.
- Web enrichment fails: set `BRAVE_SEARCH_API_KEY`; some public pages may still
  be skipped by the SSRF/content-type/size guards.
- `tsc --noEmit` complains about generated Next route types: run
  `npm run build` once to regenerate `.next/types`, then rerun typecheck.
