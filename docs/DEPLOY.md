# Deploy checklist — quantatalent.vercel.app

The app is build-ready (`next build` passes, 17 routes). Follow these steps to
ship it to Vercel under **Cooper's projects** and make the backend live.

---

## 0. Finish local config (one secret)

Paste the Supabase **service_role** key into `.env.local`:

```
SUPABASE_SERVICE_ROLE_KEY=<Supabase Dashboard → Project Settings → API keys → service_role>
```

Then `npm run dev` and you can exercise the full flow locally. (OpenAI, Resend,
and Brave keys are already in `.env.local`.)

---

## 1. Deploy with the Vercel CLI

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

## 2. Set Environment Variables in Vercel

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
| `ADMIN_EMAILS` | `shanli@stanford.edu` (comma-separate to add more) |
| `NEXT_PUBLIC_SITE_URL` | `https://quantatalent.vercel.app` |
| `CRON_SECRET` | *(any random string, e.g. `openssl rand -hex 16`)* |

Redeploy after setting them (`npx vercel --prod`) so they take effect.

---

## 3. Supabase Auth URLs (for admin magic-link)

Supabase Dashboard → **Authentication → URL Configuration**:
- **Site URL**: `https://quantatalent.vercel.app`
- **Redirect URLs**: add `https://quantatalent.vercel.app/**` and `http://localhost:3000/**`

Without this, the magic-link callback (`/admin/auth/callback`) won't complete.

---

## 4. Smoke test (prod)

1. Visit `/` → request to join with **your own** email (Resend test domain only
   delivers to the Resend account address).
2. Open the confirmation email → click the link → see the personalized read-back.
3. Visit `/admin` → sign in with an `ADMIN_EMAILS` address → confirm the new
   profile appears with its AI summary + signal score.
4. Try **Semantic** and **AI match** search; open a profile and try
   **Enrich from web**, **Find similar**, **AI draft** + send, résumé download.

---

## Notes
- The DB schema (tables, RLS, pgvector RPC, storage bucket) is already applied
  to Quanta DB — nothing to run there.
- The daily purge cron is registered in `vercel.json`; it needs `CRON_SECRET`.
- To use a custom sending domain later, verify it in Resend and update
  `EMAIL_FROM`; then confirmation email delivers to any address.
