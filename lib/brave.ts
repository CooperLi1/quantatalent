import "server-only"

import { env } from "@/lib/env"

export interface WebResult {
  title: string
  url: string
  description: string
}

/** Brave Web Search. Returns a small set of public results. */
export async function braveSearch(query: string, count = 6): Promise<WebResult[]> {
  if (!env.braveKey) throw new Error("BRAVE_SEARCH_API_KEY is not configured.")
  const u = new URL("https://api.search.brave.com/res/v1/web/search")
  u.searchParams.set("q", query)
  u.searchParams.set("count", String(count))
  u.searchParams.set("safesearch", "moderate")

  const res = await fetch(u, {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": env.braveKey,
    },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`Brave search failed: ${res.status}`)
  const data = (await res.json()) as {
    web?: { results?: { title: string; url: string; description?: string }[] }
  }
  return (data.web?.results ?? []).map((r) => ({
    title: r.title,
    url: r.url,
    description: r.description ?? "",
  }))
}

/**
 * SSRF guard: only allow http(s) to public hosts. Blocks localhost, private
 * IP ranges, link-local, and the cloud metadata endpoint.
 */
export function isPublicUrl(raw: string): boolean {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return false
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false
  const host = url.hostname.toLowerCase()
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal"))
    return false
  // Literal IPv4 checks
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])]
    if (a === 10) return false
    if (a === 127) return false
    if (a === 0) return false
    if (a === 169 && b === 254) return false // link-local + metadata
    if (a === 172 && b >= 16 && b <= 31) return false
    if (a === 192 && b === 168) return false
    if (a === 100 && b >= 64 && b <= 127) return false // CGNAT
  }
  if (host === "[::1]" || host.startsWith("[fc") || host.startsWith("[fd")) return false
  return true
}

/** Fetch a page and return stripped, length-capped readable text. */
export async function fetchReadable(url: string, maxChars = 4000): Promise<string | null> {
  if (!isPublicUrl(url)) return null
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(7000),
      headers: { "User-Agent": "QuantaTalentBot/1.0 (+https://quantatalent.vercel.app)" },
    })
    if (!res.ok) return null
    const type = res.headers.get("content-type") || ""
    if (!type.includes("text/html") && !type.includes("text/plain")) return null
    // Cap the body we read to avoid huge pages.
    const buf = await res.arrayBuffer()
    if (buf.byteLength > 2_000_000) return null
    const html = new TextDecoder().decode(buf)
    return htmlToText(html).slice(0, maxChars)
  } catch {
    return null
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
}
