"use client"

import { useActionState } from "react"
import Link from "next/link"
import { requestMagicLink, type LoginState } from "./actions"

const initial: LoginState = { sent: false }

export default function AdminLogin() {
  const [state, action, pending] = useActionState(requestMagicLink, initial)

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="label">
          Quanta · Venture Intelligence
        </Link>
        <h1 className="mt-8 text-2xl font-medium text-foreground">Admin access</h1>
        <p className="mt-2 text-sm text-muted">
          Sign in with a magic link sent to an authorized address.
        </p>

        {state.sent ? (
          <div className="mt-8 rounded-xl border border-hairline bg-[#080809] p-5 text-sm leading-relaxed text-muted">
            If that address is authorized, a sign-in link is on its way. Check your
            inbox.
          </div>
        ) : (
          <form action={action} className="mt-8 space-y-4">
            <div>
              <label htmlFor="admin-email" className="label">
                Admin email
              </label>
              <input
                id="admin-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-2 w-full rounded-lg border border-hairline bg-transparent px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-faint focus:border-accent/50"
              />
              <p className="mt-2 text-xs leading-relaxed text-faint">
                Only allowlisted Quanta team emails can enter the dashboard.
              </p>
            </div>
            {state.error && <p className="text-xs text-red-400">{state.error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-full bg-foreground py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Sending" : "Send magic link"}
            </button>
          </form>
        )}
        <Link
          href="/"
          className="mt-8 inline-block font-mono text-[0.7rem] uppercase tracking-[0.22em] text-faint hover:text-muted"
        >
          ← Back to home
        </Link>
      </div>
    </main>
  )
}
