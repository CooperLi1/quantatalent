"use client"

import { useEffect, useRef } from "react"

/**
 * A soft radial spotlight that trails the cursor across the black field.
 * Uses a rAF-eased lerp so it glides rather than snaps. Disabled for users
 * who prefer reduced motion, and skipped on touch (no pointer).
 */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce || window.matchMedia("(pointer: coarse)").matches) return

    const el = ref.current
    if (!el) return
    let tx = window.innerWidth / 2
    let ty = window.innerHeight * 0.4
    let x = tx
    let y = ty
    let raf = 0

    const onMove = (e: MouseEvent) => {
      tx = e.clientX
      ty = e.clientY
    }
    const tick = () => {
      x += (tx - x) * 0.08
      y += (ty - y) * 0.08
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`
      raf = requestAnimationFrame(tick)
    }
    window.addEventListener("mousemove", onMove)
    raf = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener("mousemove", onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-0 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 will-change-transform"
      style={{
        marginLeft: "-21rem",
        marginTop: "-21rem",
        background:
          "radial-gradient(circle, color-mix(in oklab, var(--accent) 9%, transparent) 0%, transparent 60%)",
      }}
    />
  )
}
