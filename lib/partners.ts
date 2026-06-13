/**
 * Scouts shown floating on the landing page.
 *
 * Real portraits can point to local files in /public/partners. If no portrait
 * is supplied, the component falls back to the generated placeholder sprite.
 */
export interface Partner {
  name: string
  location: string
  company: string
  sector: string
  bullets: string[]
  image?: string
  imageKind?: "photo" | "cutout"
  imagePosition?: string
  imageSize?: string
  imageIntrinsicWidth?: number
  imageIntrinsicHeight?: number
  cutoutHeight?: string
  cutoutBottom?: string
  cutoutX?: string
  initials?: string
  spriteSlot?: number
}

export const PARTNERS: Partner[] = [
  {
    name: "Placeholder",
    location: "Global",
    company: "Talent Network",
    sector: "Founder Signal",
    spriteSlot: 0,
    bullets: [
      "Reserved for a future scout profile.",
      "Represents the broader talent surface around Quanta.",
      "Keeps the edge of the field populated without stealing focus.",
    ],
  },
  {
    name: "Balaji Daggupati",
    location: "United States",
    company: "UT Dallas Chess",
    sector: "Chess & Computation",
    image: "/partners/balaji-daggupati-generated.png",
    imageKind: "cutout",
    imageIntrinsicWidth: 564,
    imageIntrinsicHeight: 819,
    cutoutHeight: "102%",
    cutoutBottom: "-4%",
    cutoutX: "50%",
    bullets: [
      "American chess grandmaster with a computer science path at UT Dallas.",
      "Reached Grandmaster title as a young player after earning all three norms in 2021.",
      "Strong pattern-recognition signal from elite competitive chess.",
    ],
  },
  {
    name: "Rory Stark",
    location: "LinkedIn",
    company: "Prospective Scout",
    sector: "Venture Signal",
    image: "/partners/rory-stark-generated.png",
    imageKind: "cutout",
    imageIntrinsicWidth: 580,
    imageIntrinsicHeight: 814,
    cutoutHeight: "102%",
    cutoutBottom: "-4%",
    cutoutX: "50%",
    bullets: [
      "Public profile supplied for inclusion in the scout field.",
      "Middle-slot placement reserved while a non-auth-walled portrait is sourced.",
      "Represents prospective venture-scout coverage in the network.",
    ],
  },
  {
    name: "Swindar Zhou",
    location: "Palo Alto",
    company: "Stanford Bioengineering",
    sector: "AI Health Systems",
    image: "/partners/swindar-zhou-generated.png",
    imageKind: "cutout",
    imageIntrinsicWidth: 724,
    imageIntrinsicHeight: 1505,
    cutoutHeight: "150%",
    cutoutBottom: "-54%",
    cutoutX: "50%",
    bullets: [
      "Stanford bioengineering admit with Notre Dame computer science training.",
      "Founder and engineering lead across AI health and product-building work.",
      "Brings founder-market signal from research, startups, and venture communities.",
    ],
  },
  {
    name: "Placeholder",
    location: "Global",
    company: "Talent Network",
    sector: "Scout Coverage",
    spriteSlot: 4,
    bullets: [
      "Reserved for a future scout profile.",
      "Frames the right edge of the talent field.",
      "Can be replaced with a named scout once photography is available.",
    ],
  },
]
