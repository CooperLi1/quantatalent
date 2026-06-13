"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import {
  adminCredentialsConfigured,
  setAdminSession,
  verifyAdminCredentials,
} from "@/lib/admin-session"
import { clientIp, rateLimit } from "@/lib/rate-limit"

export interface LoginState {
  error?: string
}

export async function loginAdmin(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = String(formData.get("username") || "").trim()
  const password = String(formData.get("password") || "")
  if (!username || !password) return { error: "Enter your username and password." }

  if (!adminCredentialsConfigured()) {
    return { error: "Admin username/password is not configured." }
  }

  const headerList = await headers()
  const ip = clientIp(headerList)
  const ipLimit = await rateLimit(`admin-login:ip:${ip}`, 10, 15 * 60)
  const usernameLimit = await rateLimit(
    `admin-login:username:${username.toLowerCase()}`,
    5,
    15 * 60
  )
  if (!ipLimit.ok || !usernameLimit.ok) {
    return { error: "Too many login attempts. Please try again later." }
  }

  const ok = await verifyAdminCredentials(username, password)
  if (!ok) return { error: "Invalid username or password." }

  await setAdminSession(username)
  redirect("/admin")
}
