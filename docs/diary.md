# Build diary

Chronological log of how Quanta Talent came together.

## Planning
- Read both references: the homepage design PDF (hero with the glowing Q, the
  floating spotlit partners, the editorial pipeline) and the screenshot (the
  hover-expanded partner bio, e.g. "Sofia Lind / Stockholm / Helix Memory").
- Confirmed infra access: Supabase "Quanta DB" in the "Quanta" org, Vercel
  "Cooper's projects" team.
- Locked early decisions with the user: OpenAI/GPT; initially Supabase
  magic-link admin auth, later replaced with username/password; lightweight
  anti-abuse (honeypot + Postgres rate-limiting); placeholder
  partners; ingest-on-signup but expose-on-confirm; dropped the three-category
  bucketing; Resend testing domain.

## Database
- Applied schema to Quanta DB: `candidates` (+ `embedding vector(1536)`),
  `confirmation_tokens` (hashed), `rate_limits`, `email_events`, `admin_audit`,
  `saved_roles`. Enabled `vector`, `citext`, `pgcrypto`, `pg_trgm`.
- RLS enabled with **no policies** (deny-all to anon/authenticated); all access
  via the service role. Added `match_candidates` (cosine search) and
  `bump_rate_limit` (atomic fixed-window) RPCs; private `resumes` storage bucket.
- Pinned function `search_path`; security advisor shows only the expected
  "RLS enabled, no policy" INFO notices.

## Server libraries
- DAL (service-role, `server-only`), env accessor, Supabase admin client,
  admin signed-cookie session helpers, crypto (token gen + sha256 hash +
  constant-time compare), zod
  validation, Postgres rate-limiter, OpenAI helpers, résumé extraction (unpdf),
  ingestion pipeline (one completion + one embedding), Resend email, Brave
  search + SSRF-guarded fetch, enrichment, two-stage AI role-match.

## Frontend
- Design system in `globals.css` (pure black, cyan/blue + magenta accents,
  mono labels). Cloned the **Q** from quantaventures.ai: pulled their real path
  data, used it as a CSS mask over a moving blue gradient with an orbiting
  magenta glow on an oval path; added the reference hero's ambient glow.
- Landing: hero, floating partners with hover-expand bios, editorial pipeline,
  footer. Join modal with résumé dropzone + instant parse read-back, honeypot,
  validation. Confirm page with personalized AI read-back. Privacy policy.
- Admin: username/password login, signed session cookie, dashboard (stats,
  semantic + AI search, expandable profiles,
  enrich/similar/draft-contact/résumé/delete).

## Verification
- `tsc --noEmit` clean; `next build` green. Viewed the hero in a
  live preview and iterated on the Q until it matched the reference.

## Deployment
- (see PROJECT.md §12 for remaining: Vercel deploy + env.)

## June 13, 2026 audit and hardening
- Re-audited every route and feature except the homepage UI work being handled
  in parallel. Baseline `eslint`, `tsc --noEmit`, and `next build` were clean.
- Confirmed local secrets are present without printing values. Supabase MCP does
  **not** have permission to manage Quanta DB (`dkabdrrpwsgxgfkwljcq`), but a
  local service-role probe verified the real backend: expected tables, private
  `resumes` bucket, working `bump_rate_limit` RPC, and anon-key `permission
  denied` on `candidates`.
- Vercel connector can see Cooper's team (`team_Mb1NYVWemYdfwasn6zQATd5w`) but
  listed no Vercel projects, so production deployment still needs to be created
  and configured.
- Earlier admin hardening work covered Supabase magic-link callback behavior;
  this was later replaced by the current username/password form and signed
  HTTP-only admin session cookie.
- Hardened `/api/join`: honeypot short-circuits before validation, pending-row
  updates and token writes are checked, DOCX résumé paths keep a `.docx`
  extension, and storage/update failures are logged without blocking signup.
- Tightened confirmation token claiming with a `used_at is null` guard and
  explicit candidate update error handling.
- Strengthened web enrichment SSRF handling by validating redirects manually,
  normalizing IPv6 literals, blocking private IPv6/link-local/IPv4-mapped
  private hosts, and bounding redirect depth.
- Polished admin/login/privacy surfaces: labels instead of placeholder-only
  inputs, visible search errors, calmer loading labels, cleaner privacy copy,
  and a concrete privacy date.
- Browser screenshots succeeded for `/`, `/privacy`, `/confirm?token=invalid`,
  and anonymous `/admin` on the running dev server. A disposable E2E probe
  verified `/api/join` creates a pending candidate, a seeded confirmation token
  flips a candidate to confirmed through `/confirm`, anonymous admin API returns
  401, and test rows are cleaned up.

## June 13, 2026 social previews
- Added a complete preview layer: root metadata, generated Open Graph/Twitter
  PNG cards, generated app/apple icons, web manifest, robots, and sitemap.
- The generated share card keeps the black Quanta atmosphere, glowing Q path,
  and clear positioning for future founders, venture scouts, and exceptional
  talent. Verified the OG PNG renders at 1200x630 and the production build
  prerenders the metadata assets.
- Fixed the confirmation success copy so personalized names render as
  "`First, your email is confirmed.`" instead of collapsing "your" and "email".

## June 13, 2026 admin credentials + duplicate copy
- Switched `/admin` from Supabase magic-link auth to a username/password form
  backed by env vars and an HTTP-only signed session cookie. Demo credentials
  are `user` / `quanta123` until replaced for production.
- Removed the stale admin magic-link callback/proxy path. Admin pages and APIs
  now use the same signed-cookie guard.
- Confirmed duplicate join submissions now tell the visitor they are already
  in the Quanta Talent community instead of showing the normal inbox prompt.
- Web enrichment is now marked beta in the admin UI, warns admins about
  common-name ambiguity, and stores only public links the LLM judged to
  plausibly match the candidate.
