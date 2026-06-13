"use client"

import Image from "next/image"
import { useState, type CSSProperties } from "react"
import { PARTNERS, type Partner } from "@/lib/partners"
import { cn } from "@/lib/utils"

type PortraitStyle = CSSProperties & {
  "--portrait-image"?: string
  "--portrait-position"?: string
  "--portrait-size"?: string
  "--portrait-slot"?: string
  "--portrait-height"?: string
  "--portrait-bottom"?: string
  "--portrait-x"?: string
}
type DetailStyle = CSSProperties & {
  "--detail-left": string
  "--detail-top": string
}
const PLACEMENTS = [
  "partner-placement--one",
  "partner-placement--two",
  "partner-placement--three",
  "partner-placement--four",
  "partner-placement--five",
]
const DETAIL_POSITIONS = [
  { left: "29%", top: "44%", side: "right" },
  { left: "9%", top: "63%", side: "left" },
  { left: "30%", top: "49%", side: "left" },
  { left: "52%", top: "58%", side: "left" },
  { left: "72%", top: "44%", side: "left" },
] as const

function Portrait({
  partner,
  index,
  active,
  dimmed,
  onActivate,
  onClear,
}: {
  partner: Partner
  index: number
  active: boolean
  dimmed: boolean
  onActivate: () => void
  onClear: () => void
}) {
  const portraitStyle: PortraitStyle = partner.image
    ? {
        "--portrait-image": `url("${partner.image}")`,
        "--portrait-position": partner.imagePosition ?? "50% 24%",
        "--portrait-size": partner.imageSize ?? "cover",
        "--portrait-height": partner.cutoutHeight ?? "96%",
        "--portrait-bottom": partner.cutoutBottom ?? "0%",
        "--portrait-x": partner.cutoutX ?? "50%",
      }
    : { "--portrait-slot": String(partner.spriteSlot ?? index) }

  return (
    <button
      type="button"
      onMouseEnter={onActivate}
      onMouseLeave={onClear}
      onFocus={onActivate}
      onBlur={onClear}
      aria-pressed={active}
      aria-label={`${partner.name}, ${partner.company}`}
      className={cn(
        "partner-node",
        PLACEMENTS[index],
        active && "is-active",
        dimmed && "is-dimmed"
      )}
    >
      <span className="partner-photo-crop" aria-hidden>
        {partner.image && partner.imageKind === "cutout" ? (
          <Image
            src={partner.image}
            alt=""
            width={partner.imageIntrinsicWidth ?? 900}
            height={partner.imageIntrinsicHeight ?? 1300}
            sizes="12vw"
            className="partner-photo-cutout"
            style={portraitStyle}
          />
        ) : partner.image ? (
          <span
            className="partner-photo-image"
            style={portraitStyle}
          />
        ) : partner.initials ? (
          <span className="partner-photo-initials">{partner.initials}</span>
        ) : (
          <span className="partner-photo-strip" style={portraitStyle} />
        )}
      </span>
    </button>
  )
}

export function Partners() {
  const [active, setActive] = useState<number | null>(null)
  const current = active === null ? null : PARTNERS[active]
  const detail = active === null ? null : DETAIL_POSITIONS[active]
  const detailStyle: DetailStyle | undefined = detail
    ? { "--detail-left": detail.left, "--detail-top": detail.top }
    : undefined

  return (
    <div className="partners-showcase" onMouseLeave={() => setActive(null)}>
      <div className="partners-portraits" aria-label="Featured scouts">
        {PARTNERS.map((p, i) => (
          <Portrait
            key={`${p.name}-${i}`}
            partner={p}
            index={i}
            active={active === i}
            dimmed={active !== null && active !== i}
            onActivate={() => setActive(i)}
            onClear={() => setActive(null)}
          />
        ))}
      </div>

      {current && detail && (
        <div
          key={current.name}
          className={cn(
            "partner-detail",
            detail.side === "right" ? "is-right" : "is-left"
          )}
          style={detailStyle}
        >
          <div className="label">{current.location}</div>
          <h3>{current.name}</h3>
          <div className="label mt-2 text-accent/70">{current.company}</div>
          <ul>
            {current.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
          <div className="partner-detail-rule" />
          <div className="label">{current.sector}</div>
        </div>
      )}
    </div>
  )
}
