import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy · Quanta",
  description: "How Quanta handles the data you share when requesting to join.",
}

const sections: { h: string; body: string[] }[] = [
  {
    h: "Information you share",
    body: [
      "When you request to join, we collect the information you submit: your full name, email address, a short blurb about your background, and, optionally, a LinkedIn URL and a résumé file.",
      "We also collect basic request details, such as timestamps and information needed to help prevent spam, abuse, and repeated automated submissions.",
    ],
  },
  {
    h: "How we use information",
    body: [
      "We send a confirmation email to verify your address. Your profile is only made visible to the Quanta venture team after you confirm.",
      "We use the information you provide to understand your background, evaluate whether there may be a fit for the community, and help the venture team review confirmed profiles.",
      "If you attach a résumé, we may extract text from it to create a short preview for you and to help summarize your profile.",
    ],
  },
  {
    h: "AI and public information",
    body: [
      "We may use AI tools to create concise summaries and labels from your submission and optional résumé, so the team can review relevant backgrounds more quickly.",
      "After you confirm, the team may use public web sources, such as pages returned by search engines or your LinkedIn profile, to help corroborate details you shared. Public research can be imperfect, especially for common names, so it is treated as review material rather than an automatic decision.",
    ],
  },
  {
    h: "Email and outreach",
    body: [
      "We use email to send confirmation links and, if there is a potential fit, direct outreach from the Quanta team.",
      "We do not sell your information or send unrelated marketing email from this request.",
    ],
  },
  {
    h: "Access and sharing",
    body: [
      "Unconfirmed profiles are not shown to the venture team for review. Confirmed profiles are visible to authorized Quanta team members reviewing the community.",
      "We use service providers to operate the site, send email, store submissions, analyze profiles, and perform public web research.",
    ],
  },
  {
    h: "Retention and security",
    body: [
      "Unconfirmed requests are automatically purged after 14 days. Confirmed profiles are retained as part of the talent community unless removed by the team.",
      "We use reasonable safeguards to protect submitted information, including restricted team access, private résumé storage, and time-limited confirmation links.",
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
