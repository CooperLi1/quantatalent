import { QMark } from "@/components/site/q-mark"
import { Partners } from "@/components/site/partners"
import { CursorGlow } from "@/components/site/cursor-glow"
import { IntroReveal } from "@/components/site/intro-reveal"
import { Reveal } from "@/components/site/reveal"
import { JoinProvider, JoinTrigger } from "@/components/site/join-dialog"

const PIPELINE = [
  ["Scouts discover", "Operators surface startups in motion."],
  ["AI structures", "Conversations become venture intelligence."],
  ["Team evaluates", "Signal is reviewed by the network."],
  ["Follow-ups compound", "Relationships deepen over time."],
  ["Signal surfaces", "The right companies rise early."],
]

export default function Home() {
  return (
    <JoinProvider>
      <IntroReveal />
      <CursorGlow />
      <main className="relative z-10">
        {/* ───────────────────────── Hero ───────────────────────── */}
        <section className="hero-shell">
          <div aria-hidden className="hero-ambient" />

          <div className="hero-kicker label">/ Venture Intelligence</div>

          <div className="hero-mark-wrap">
            <QMark className="hero-qmark" />
          </div>

          <div className="hero-scroll-cue label">Scroll down ↓</div>

          <aside className="hero-control-panel" aria-label="Scout portal">
            <div className="hero-panel-line" />
            <div className="hero-control-copy">
              <span className="label">Aspiring Future Founders</span>
              <span className="label">Prospective Venture Scouts</span>
              <span className="label">0.01% Exceptional Talent</span>
            </div>
            <JoinTrigger className="portal-pill">Join our talent community</JoinTrigger>
          </aside>
        </section>

        {/* ─────────────────────── Partners ─────────────────────── */}
        <section id="scouts" className="scout-section">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="section-title text-3xl font-medium leading-tight tracking-tight sm:text-5xl">
              Exceptional operators at the edge of signal.
            </h2>
            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted">
              The network compounds through people with taste, context, and trusted
              access — long before consensus forms.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <Partners />
          </Reveal>

          <Reveal className="mx-auto mt-10 max-w-xl text-center sm:mt-2">
            <h3 className="text-2xl font-medium tracking-tight text-foreground">
              For scouts with uncommon access.
            </h3>
            <p className="label mt-4 leading-loose">
              Join the people surfacing companies before the market knows where to look.
            </p>
            <div className="mt-8 flex justify-center">
              <JoinTrigger className="portal-pill">Join our talent community</JoinTrigger>
            </div>
          </Reveal>
        </section>

        {/* ─────────────────────── Editorial ────────────────────── */}
        <section className="relative overflow-hidden border-t border-hairline px-6 py-28 sm:px-12 sm:py-40">
          {/* faint Q watermark */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 top-1/2 -z-10 hidden -translate-y-1/2 opacity-[0.06] sm:block"
          >
            <QMark className="h-[34rem] w-auto" />
          </div>

          <div className="mx-auto grid max-w-5xl gap-16 sm:grid-cols-2">
            <Reveal>
              <h2 className="text-balance text-3xl font-medium leading-snug tracking-tight text-foreground sm:text-[2.6rem]">
                A distributed network turning human intuition into venture signal.
              </h2>
              <p className="mt-7 max-w-md text-sm leading-relaxed text-muted">
                Scouts surface startups early. Operators discover opportunities in
                motion. AI turns conversations into structured venture intelligence.
              </p>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
                The workflow stays lightweight while the network compounds globally:
                faster discovery, sharper follow-up, clearer signal.
              </p>
            </Reveal>

            <Reveal delay={120}>
              <ol className="divide-y divide-hairline">
                {PIPELINE.map(([title, desc], i) => (
                  <li key={title} className="flex items-baseline justify-between gap-6 py-4">
                    <div>
                      <div className="label text-muted">{title}</div>
                      <div className="mt-1 text-xs text-faint">{desc}</div>
                    </div>
                    <span className="font-mono text-xs text-faint">
                      0{i + 1}
                    </span>
                  </li>
                ))}
              </ol>
              <div className="mt-10">
                <JoinTrigger className="portal-pill">Join our talent community</JoinTrigger>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ──────────────────────── Footer ──────────────────────── */}
        <footer className="border-t border-hairline px-6 py-10 sm:px-12">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
            <span className="label">Quanta · Venture Intelligence</span>
            <div className="flex items-center gap-6">
              <a href="/privacy" className="label transition-colors hover:text-muted">
                Privacy
              </a>
              <span className="label">© {new Date().getFullYear()}</span>
            </div>
          </div>
        </footer>
      </main>
    </JoinProvider>
  )
}
