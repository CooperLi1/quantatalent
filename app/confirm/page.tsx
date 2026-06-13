import Link from "next/link"
import { confirmByToken, type ConfirmOutcome } from "@/lib/confirm"

export const dynamic = "force-dynamic"

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const outcome: ConfirmOutcome = token
    ? await confirmByToken(token)
    : { status: "invalid" }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="label">
          Quanta · Venture Intelligence
        </Link>
        <div className="mt-10">{render(outcome)}</div>
        <Link
          href="/"
          className="mt-10 inline-block font-mono text-[0.7rem] uppercase tracking-[0.22em] text-faint transition-colors hover:text-muted"
        >
          ← Back to home
        </Link>
      </div>
    </main>
  )
}

function render(o: ConfirmOutcome) {
  switch (o.status) {
    case "confirmed":
    case "already":
      return (
        <>
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-accent/30 text-2xl text-accent">
            ✓
          </div>
          <h1 className="text-2xl font-medium text-foreground">
            {o.status === "confirmed" ? "You're in." : "Already confirmed."}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {o.fullName
              ? `${o.fullName.split(" ")[0]}, your email is confirmed.`
              : "Your email is confirmed."}{" "}
            You&apos;re now part of the community we surface to the venture team.
          </p>
          {o.summary && (
            <div className="mt-8 rounded-xl border border-hairline bg-[#080809] p-5 text-left">
              <div className="label flex items-center justify-between">
                <span>How we read you</span>
                {typeof o.score === "number" && (
                  <span className="text-accent/80">Signal {o.score}/100</span>
                )}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">{o.summary}</p>
            </div>
          )}
        </>
      )
    case "expired":
      return (
        <>
          <h1 className="text-2xl font-medium text-foreground">Link expired</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            This confirmation link is no longer valid. Request access again and we&apos;ll
            send a fresh link.
          </p>
        </>
      )
    default:
      return (
        <>
          <h1 className="text-2xl font-medium text-foreground">Invalid link</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            We couldn&apos;t verify this confirmation link. It may have already been used.
          </p>
        </>
      )
  }
}
