import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy · Quanta",
  description: "How Quanta handles the data you share when requesting to join.",
}

const sections: { h: string; body: string[] }[] = [
  {
    h: "What we collect",
    body: [
      "When you request to join, we collect the information you submit: your full name, email address, a short blurb about your background, and, optionally, a LinkedIn URL and a résumé file.",
      "We also record minimal technical metadata (IP address, browser user-agent, timestamps) for security, abuse prevention, and rate limiting.",
    ],
  },
  {
    h: "How we use it",
    body: [
      "We send a confirmation email to verify your address. Your profile is only made visible to the Quanta venture team after you confirm.",
      "We use AI to generate a concise summary and structured tags from the information you provide, to help the team understand your background. This analysis is derived only from what you submit.",
      "With your participation in the community, the team may research publicly available information about you to corroborate your background. This uses only public web sources.",
    ],
  },
  {
    h: "Email",
    body: [
      "Transactional email (confirmation and any direct outreach) is sent via Resend. We log delivery status to operate the service. We do not sell your data or send marketing email.",
    ],
  },
  {
    h: "Storage & security",
    body: [
      "Data is stored in a private Supabase (PostgreSQL) database with row-level security enabled; application access is mediated server-side. Résumés are kept in a private storage bucket and are never publicly accessible.",
      "Confirmation links are single-use, time-limited, and only a cryptographic hash of each token is stored.",
    ],
  },
  {
    h: "Retention",
    body: [
      "Unconfirmed requests are automatically purged after 14 days. Confirmed profiles are retained as part of the community until you ask us to remove them.",
    ],
  },
  {
    h: "Your rights",
    body: [
      "You can request a copy of your data or its deletion at any time by emailing privacy@quantaventures.ai. We will remove your profile and associated files on request.",
    ],
  },
]

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <Link href="/" className="label">
        ← Quanta · Venture Intelligence
      </Link>
      <h1 className="mt-10 text-3xl font-medium tracking-tight text-foreground">
        Privacy Policy
      </h1>
      <p className="mt-3 text-xs text-faint">Last updated: June 13, 2026</p>

      <div className="mt-12 space-y-10">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="label text-muted">{s.h}</h2>
            <div className="mt-3 space-y-3">
              {s.body.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-muted">
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
