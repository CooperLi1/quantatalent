"use client"

import { useActionState } from "react"
import Link from "next/link"
import { loginAdmin, type LoginState } from "./actions"

const initial: LoginState = {}

export default function AdminLogin() {
  const [state, action, pending] = useActionState(loginAdmin, initial)

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="label">
          Quanta · Venture Intelligence
        </Link>
        <h1 className="mt-8 text-2xl font-medium text-foreground">Admin access</h1>
        <p className="mt-2 text-sm text-muted">
          Sign in with the admin username and password.
        </p>

        <form action={action} className="mt-8 space-y-4">
          <div>
            <label htmlFor="admin-username" className="label">
              Username
            </label>
            <input
              id="admin-username"
              name="username"
              type="text"
              required
              autoComplete="username"
              className="mt-2 w-full rounded-lg border border-hairline bg-transparent px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-faint focus:border-accent/50"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="label">
              Password
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-2 w-full rounded-lg border border-hairline bg-transparent px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-faint focus:border-accent/50"
            />
            <p className="mt-2 text-xs leading-relaxed text-faint">
              Authorized Quanta operators only.
            </p>
          </div>
          {state.error && <p className="text-xs text-red-400">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-foreground py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Signing in" : "Sign in"}
          </button>
        </form>
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
