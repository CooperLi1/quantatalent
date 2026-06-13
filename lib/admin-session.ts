import "server-only"

import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"
import { cookies } from "next/headers"
import { env } from "@/lib/env"

const scryptAsync = promisify(scrypt)

export const ADMIN_SESSION_COOKIE = "quanta_admin_session"
const SESSION_TTL_SECONDS = 8 * 60 * 60

interface AdminSessionPayload {
  sub: string
  iat: number
  exp: number
  nonce: string
}

export function adminCredentialsConfigured(): boolean {
  return Boolean(env.adminUsername && (env.adminPasswordHash || env.adminPassword))
}

export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<boolean> {
  const configuredUsername = env.adminUsername
  if (!configuredUsername || !password) return false
  if (!safeEqualString(username.trim(), configuredUsername)) return false

  const hash = env.adminPasswordHash
  if (hash) return verifyScryptPassword(password, hash)

  const configuredPassword = env.adminPassword
  return Boolean(configuredPassword && safeEqualString(password, configuredPassword))
}

export async function setAdminSession(username: string) {
  const now = Math.floor(Date.now() / 1000)
  const payload: AdminSessionPayload = {
    sub: username,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
    nonce: randomBytes(12).toString("base64url"),
  }
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const token = `${body}.${sign(body)}`
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  })
}

export async function clearAdminSession() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_SESSION_COOKIE)
}

export async function readAdminSession(): Promise<{ username: string } | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  if (!token) return null

  const [body, signature] = token.split(".")
  if (!body || !signature || !safeEqualString(signature, sign(body))) return null

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    ) as Partial<AdminSessionPayload>
    if (!payload.sub || typeof payload.exp !== "number") return null
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null
    if (payload.sub !== env.adminUsername) return null
    return { username: payload.sub }
  } catch {
    return null
  }
}

function sign(body: string): string {
  return createHmac("sha256", env.adminSessionSecret).update(body).digest("base64url")
}

async function verifyScryptPassword(password: string, encoded: string): Promise<boolean> {
  const [scheme, saltB64, expectedB64] = encoded.split(":")
  if (scheme !== "scrypt" || !saltB64 || !expectedB64) return false

  try {
    const salt = Buffer.from(saltB64, "base64url")
    const expected = Buffer.from(expectedB64, "base64url")
    const actual = (await scryptAsync(password, salt, expected.length)) as Buffer
    return timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

function safeEqualString(a: string, b: string): boolean {
  const left = createHmac("sha256", "admin-compare").update(a).digest()
  const right = createHmac("sha256", "admin-compare").update(b).digest()
  return timingSafeEqual(left, right)
}
