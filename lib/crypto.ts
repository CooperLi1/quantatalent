import "server-only"

import { createHash, randomBytes, timingSafeEqual } from "node:crypto"

/**
 * Confirmation tokens: we generate a high-entropy random token, email the
 * RAW token, and persist only its SHA-256 hash. A stolen database therefore
 * never reveals a usable confirmation link.
 */
export function generateToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url")
  return { raw, hash: hashToken(raw) }
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex")
}

/** Constant-time comparison of two hex digests of equal length. */
export function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"))
  } catch {
    return false
  }
}
