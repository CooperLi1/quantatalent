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
<div style="margin:0;padding:0;background:#f4f6f7;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#151619;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f4f6f7;">
    <tr>
      <td align="center" style="padding:36px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;max-width:600px;background:#ffffff;border:1px solid #dfe4e8;border-radius:22px;overflow:hidden;">
          <tr>
            <td style="padding:0;background:#ffffff;">
              <div style="height:4px;line-height:4px;background:#48bde8;font-size:1px;">&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td style="padding:38px 42px 32px;">
              <div style="font-family:SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace;font-size:11px;letter-spacing:0.24em;line-height:1.4;color:#6b7280;text-transform:uppercase;margin-bottom:28px;">Quanta / Venture Intelligence</div>
              ${inner}
              <div style="margin-top:36px;padding-top:22px;border-top:1px solid #e3e7eb;font-size:12px;color:#6b7280;line-height:1.65;">
                You received this because someone requested to join the Quanta talent community with this address.
                If that was not you, ignore this email and no profile will be created.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>`

export async function sendConfirmationEmail(candidate: {
  id: string
  email: string
  full_name: string
}, rawToken: string): Promise<void> {
  const url = `${env.emailSiteUrl}/confirm?token=${encodeURIComponent(rawToken)}`
  const subject = "Confirm your request to join Quanta"
  const safeUrl = escapeHtml(url)
  const firstName = escapeHtml(candidate.full_name.split(" ")[0] || "there")
  const html = shell(`
    <div style="font-size:28px;line-height:1.16;color:#151619;font-weight:600;letter-spacing:-0.01em;margin:0 0 16px;">Confirm your email</div>
    <p style="font-size:16px;line-height:1.65;color:#4b5563;margin:0 0 28px;max-width:500px;">
      ${firstName}, confirm this address to continue your request to join the people surfacing companies before consensus forms.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 30px;">
      <tr>
        <td style="background:#111316;border-radius:999px;">
          <a href="${safeUrl}" style="display:inline-block;color:#ffffff;text-decoration:none;font-size:14px;font-weight:650;letter-spacing:0.01em;padding:14px 26px;border-radius:999px;">Confirm my email</a>
        </td>
      </tr>
    </table>
    <div style="background:#f7f9fa;border:1px solid #e3e7eb;border-radius:14px;padding:14px 16px;">
      <div style="font-size:12px;line-height:1.55;color:#6b7280;margin:0 0 6px;">This link expires in 24 hours. If the button does not work, paste this into your browser.</div>
      <a href="${safeUrl}" style="font-size:12px;line-height:1.55;color:#256f8f;text-decoration:underline;word-break:break-all;">${safeUrl}</a>
    </div>
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
    `<div style="font-size:15px;line-height:1.7;color:#30343a;white-space:pre-wrap;">${escapeHtml(
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
