# Deploy Checklist - quantatalent.vercel.app

The app is build-ready (`next build` passes, 23 app routes). Follow these steps to
ship it to Vercel under **Cooper's projects** and make the backend live.

---

## 0. Finish Local Config

Copy `.env.example` to `.env.local` and fill in the server-side secrets:

```bash
cp .env.example .env.local
```

At minimum for a full demo, set:

- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `RESEND_API_KEY`
- `BRAVE_SEARCH_API_KEY`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH`
- `ADMIN_SESSION_SECRET`
- `CRON_SECRET`

---

## 1. Deploy With The Vercel CLI

```bash
npx vercel login                      # authenticate
npx vercel link                       # scope: "Cooper's projects"; project name: quantatalent
npx vercel --prod                     # production deploy
```

`vercel link` creates `.vercel/project.json` (gitignored). The project name
`quantatalent` yields the domain `quantatalent.vercel.app`.

> `.env.local` is gitignored and is NOT uploaded — set env vars in the Vercel
> project (step 2) so the build and runtime have them.

---

## 2. Set Environment Variables In Vercel

Project → Settings → Environment Variables (Production + Preview). Public values
are below; copy the secret values from your `.env.local`.

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://dkabdrrpwsgxgfkwljcq.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_S3lpylAQjwkNwiyE0b1qAg_DPSWiCYr` |
| `SUPABASE_SERVICE_ROLE_KEY` | *(secret — from Supabase dashboard)* |
| `OPENAI_API_KEY` | *(from `.env.local`)* |
| `OPENAI_CHAT_MODEL` | `gpt-4o-mini` |
| `RESEND_API_KEY` | *(from `.env.local`)* |
| `EMAIL_FROM` | `Quanta Talent <onboarding@resend.dev>` |
| `BRAVE_SEARCH_API_KEY` | *(from `.env.local`)* |
| `ADMIN_USERNAME` | `user` |
| `ADMIN_PASSWORD` | `quanta123` *(demo only; replace before real use)* |
| `ADMIN_PASSWORD_HASH` | *(optional; preferred over plaintext password for production)* |
| `ADMIN_SESSION_SECRET` | *(any random string; falls back to `CRON_SECRET` if unset)* |
| `NEXT_PUBLIC_SITE_URL` | `https://quantatalent.vercel.app` |
| `CRON_SECRET` | *(any random string, e.g. `openssl rand -hex 16`)* |

Redeploy after setting them (`npx vercel --prod`) so they take effect.

---

## 3. Smoke Test Production

1. Visit `/` → request to join with **your own** email (Resend test domain only
   delivers to the Resend account address).
2. Open the confirmation email → click the link → see the personalized read-back.
3. Visit `/admin` → sign in with `ADMIN_USERNAME` / `ADMIN_PASSWORD` → confirm
   the new profile appears with its AI summary + signal score.
4. Try **Semantic** and **AI match** search; open a profile and try
   **Run research** (web enrichment beta), **Find similar**, **AI draft** +
   send, and résumé download.

---

## Notes
- The DB schema (tables, RLS, pgvector RPC, storage bucket) is already applied
  to Quanta DB — nothing to run there.
- The daily purge cron is registered in `vercel.json`; it needs `CRON_SECRET`.
- To use a custom sending domain later, verify it in Resend and update
  `EMAIL_FROM`; then confirmation email delivers to any address.
