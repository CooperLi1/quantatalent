import "server-only"

import { Resend } from "resend"
import { env } from "@/lib/env"
import { supabaseAdmin } from "@/lib/supabase/admin"

let resend: Resend | null = null
function client(): Resend | null {
  if (!env.resendKey) return null
  if (!resend) resend = new Resend(env.resendKey)
  return resend
}

function logEvent(row: {
  candidate_id: string | null
  kind: string
  to_email: string
  subject: string
  status: string
  resend_id?: string | null
  meta?: Record<string, unknown>
}) {
  return supabaseAdmin()
    .from("email_events")
    .insert({
      candidate_id: row.candidate_id,
      kind: row.kind,
      to_email: row.to_email,
      subject: row.subject,
      status: row.status,
      resend_id: row.resend_id ?? null,
      meta: (row.meta ?? null) as never,
    })
}

const shell = (inner: string) => `
<div style="background:#0a0a0a;padding:48px 24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;color:#e5e5e5;">
    <div style="font-size:12px;letter-spacing:0.3em;color:#6b7280;text-transform:uppercase;margin-bottom:32px;">Quanta&nbsp;·&nbsp;Venture Intelligence</div>
    ${inner}
    <div style="margin-top:40px;padding-top:24px;border-top:1px solid #1f1f1f;font-size:12px;color:#525252;line-height:1.6;">
      You received this because someone requested to join the Quanta talent community with this address.
      If that wasn't you, ignore this email and no profile will be created.
    </div>
  </div>
</div>`

export async function sendConfirmationEmail(candidate: {
  id: string
  email: string
  full_name: string
}, rawToken: string): Promise<void> {
  const url = `${env.siteUrl}/confirm?token=${encodeURIComponent(rawToken)}`
  const subject = "Confirm your request to join Quanta"
  const html = shell(`
    <div style="font-size:22px;color:#fafafa;font-weight:500;margin-bottom:16px;">Confirm your email</div>
    <p style="font-size:15px;line-height:1.7;color:#a3a3a3;margin:0 0 28px;">
      ${escapeHtml(candidate.full_name.split(" ")[0])}, you're one click from joining the people surfacing companies before the market knows where to look. Confirm this address to enter the community.
    </p>
    <a href="${url}" style="display:inline-block;background:#fafafa;color:#0a0a0a;text-decoration:none;font-size:14px;font-weight:600;padding:14px 28px;border-radius:999px;">Confirm my email</a>
    <p style="font-size:13px;color:#525252;margin:28px 0 0;">This link expires in 24 hours. If the button doesn't work, paste this into your browser:<br/><span style="color:#737373;word-break:break-all;">${url}</span></p>
  `)

  const api = client()
  if (!api) {
    // Dev fallback: no Resend key configured — surface the link in logs.
    console.warn(`[email] RESEND not configured. Confirmation link for ${candidate.email}:\n${url}`)
    await logEvent({
      candidate_id: candidate.id,
      kind: "confirmation",
      to_email: candidate.email,
      subject,
      status: "skipped_no_key",
    })
    return
  }

  const { data, error } = await api.emails.send({
    from: env.emailFrom,
    to: candidate.email,
    subject,
    html,
  })
  await logEvent({
    candidate_id: candidate.id,
    kind: "confirmation",
    to_email: candidate.email,
    subject,
    status: error ? "failed" : "sent",
    resend_id: data?.id,
    meta: error ? { error: error.message } : undefined,
  })
  if (error) throw new Error(`Resend error: ${error.message}`)
}

export async function sendOutreachEmail(args: {
  candidateId: string
  to: string
  subject: string
  body: string
  adminEmail: string
}): Promise<{ ok: boolean; error?: string }> {
  const html = shell(
    `<div style="font-size:15px;line-height:1.7;color:#d4d4d4;white-space:pre-wrap;">${escapeHtml(
      args.body
    )}</div>`
  )
  const api = client()
  if (!api) {
    return { ok: false, error: "Email sending is not configured (no RESEND_API_KEY)." }
  }
  const { data, error } = await api.emails.send({
    from: env.emailFrom,
    to: args.to,
    replyTo: args.adminEmail,
    subject: args.subject,
    html,
  })
  await logEvent({
    candidate_id: args.candidateId,
    kind: "outreach",
    to_email: args.to,
    subject: args.subject,
    status: error ? "failed" : "sent",
    resend_id: data?.id,
    meta: { admin: args.adminEmail, ...(error ? { error: error.message } : {}) },
  })
  return error ? { ok: false, error: error.message } : { ok: true }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
