"use client"

import { useEffect, useState } from "react"

export function IntroReveal() {
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return
    }

    const timer = window.setTimeout(() => setDone(true), 1400)
    return () => window.clearTimeout(timer)
  }, [])

  if (done) return null

  return <div aria-hidden className="intro-reveal" />
}
