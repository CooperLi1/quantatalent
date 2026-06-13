/**
 * Venture partners shown floating on the landing page.
 *
 * TEMPORARY PLACEHOLDERS — swap `image` with a transparent-background PNG
 * (drop the file in /public/partners/) and update the copy when real people
 * are provided. The UI reads everything from this array, so no component
 * changes are needed to go live.
 */
export interface Partner {
  name: string
  location: string
  company: string
  sector: string
  bullets: string[]
  image?: string // e.g. "/partners/sofia.png" — transparent background
}

export const PARTNERS: Partner[] = [
  {
    name: "Yuki Tanaka",
    location: "Tokyo",
    company: "Lattice Robotics",
    sector: "Embodied Intelligence",
    bullets: [
      "Maps hardware talent across APAC robotics labs.",
      "Spotted Lattice's founding team during a university spinout.",
      "Bridges Japanese deep-tech to global capital.",
    ],
  },
  {
    name: "Priya Nair",
    location: "Bangalore",
    company: "Aperture Health",
    sector: "Computational Biology",
    bullets: [
      "Sources operators from the India–US healthtech corridor.",
      "Former founder; exited a diagnostics company.",
      "Reads scientific signal before it reaches consensus.",
    ],
  },
  {
    name: "Marcus Adeyemi",
    location: "London",
    company: "Continuum Labs",
    sector: "Autonomous Agents",
    bullets: [
      "Surfaces founders out of frontier-research circles.",
      "Backed three pre-seed teams that later raised competitive Series A rounds.",
      "Trusted reference inside London's applied-AI community.",
    ],
  },
  {
    name: "Sofia Lind",
    location: "Stockholm",
    company: "Helix Memory",
    sector: "AI Compute Systems",
    bullets: [
      "Flagged from technical founder conversations in Europe.",
      "Former ML platform lead with long-standing ties to Nordic deep-tech teams.",
      "Identified Helix Memory before the company entered fundraising mode.",
    ],
  },
  {
    name: "Daniel Reyes",
    location: "São Paulo",
    company: "Meridian Energy",
    sector: "Climate & Grid",
    bullets: [
      "Covers LatAm climate and energy founders.",
      "Network spans grid operators and frontier energy labs.",
      "Brought Meridian to the table pre-product.",
    ],
  },
]
