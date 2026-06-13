# Lessons learned

Gotchas and decisions worth remembering, captured during the build.

## Next.js 16 specifics
- This repo runs **Next 16** with behavior that differs from older versions —
  consult `node_modules/next/dist/docs/` before assuming an API. Notably:
  `cookies()`, `headers()`, route `params`, and page `searchParams` are all
  **async** (await them). `after()` from `next/server` schedules work to run
  after the response (used to ingest a candidate without blocking the reply).
- Route handlers are **uncached** by default — good for our mutation endpoints.
- `ImageResponse`/Satori is stricter than browser React: every `div` with
  multiple child nodes needs an explicit `display` (`flex`, `contents`, or
  `none`) or `next build` will fail while prerendering OG/icon routes.

## Supabase
- The **service-role key is not exposed** through the management tooling — it
  must be copied from the dashboard into `.env.local` and Vercel.
- `hnsw` index requires the `vector` extension; `gin_trgm_ops` requires
  `pg_trgm` — enable extensions before creating indexes that depend on them.
- **RLS enabled with zero policies = deny-all** for anon/authenticated. That's
  the intended posture here; the advisor's `rls_enabled_no_policy` is INFO, not
  an error. The service role bypasses RLS.
- Set `search_path` on functions (`alter function … set search_path = …`) to
  clear the `function_search_path_mutable` advisor warning.
- Returning the 1536-dim embedding over the wire is wasteful — the
  `match_candidates` RPC returns `(id, similarity)` only, and the DAL hydrates
  display columns by id.

## Type-safety
- Inserting app-shaped objects (e.g. `ai_tags`, JSON `meta`) into Supabase-typed
  columns trips the `Json` index-signature check; cast at the boundary.
- Client components must not import the `server-only` DAL even for a type — the
  dashboard defines its own local view model and the page casts at the prop
  boundary.

## The Q
- The live site's `Q_Transparent.svg` is **fully transparent** (`fill-opacity:0`)
  — the visible color is an animated gradient seen *through* the Q shape. The
  faithful clone is therefore the path used as a **CSS mask** over a moving
  gradient, not a painted SVG.
- A perfectly circular orbit makes the glow hug the ring evenly; compressing the
  orbit into an **oval** (scaleX on the rotating wrapper) makes coverage swell
  and recede like the reference. The raw SVG ratio reads "squished" — widening
  the mask box (`aspect-ratio` + `mask-size: 100% 100%`) makes the ring circular.

## Email
- The Resend **testing domain** only delivers to the account owner's address
  until a domain is verified. With no key set, we log the confirm link instead
  so the flow is testable locally.

## Cost control
- Keep AI search cheap with **retrieve-then-rank**: vector shortlist (one
  embedding) then a single ranking completion over compact summaries — never
  full résumé text. Cache enrichment on the row so it's a one-time spend.
