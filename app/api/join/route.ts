import { after, type NextRequest } from "next/server"
import { joinSchema, ALLOWED_RESUME_TYPES, MAX_RESUME_BYTES } from "@/lib/validation"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { generateToken } from "@/lib/crypto"
import { sendConfirmationEmail } from "@/lib/email"
import { extractResumeText } from "@/lib/resume"
import { ingestCandidate } from "@/lib/ingest"
import { rateLimit, clientIp } from "@/lib/rate-limit"

export const runtime = "nodejs"
export const maxDuration = 30

// Generic response — never reveals whether an email already exists.
const GENERIC_OK = {
  ok: true,
  message: "Check your inbox to confirm your email and complete your request.",
}

const ALREADY_CONFIRMED_OK = {
  ok: true,
  status: "already_confirmed",
  message:
    "You're already in the Quanta Talent community. The venture team can already see your confirmed profile.",
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers)
  const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null

  // Rate limit: 5 signups per IP per 15 min, plus a coarse global cap.
  const ipLimit = await rateLimit(`join:ip:${ip}`, 5, 15 * 60)
  if (!ipLimit.ok) {
    return Response.json(
      { ok: false, message: "Too many requests. Please try again later." },
      { status: 429 }
    )
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return Response.json({ ok: false, message: "Invalid request." }, { status: 400 })
  }

  // Honeypot filled by a bot: accept without doing work or revealing why.
  if (String(form.get("company") ?? "").trim()) {
    return Response.json(GENERIC_OK)
  }

  const parsed = joinSchema.safeParse({
    fullName: form.get("fullName"),
    email: form.get("email"),
    blurb: form.get("blurb"),
    linkedinUrl: form.get("linkedinUrl") || undefined,
    company: undefined,
  })

  // Invalid human input: return field errors for a good form experience.
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    return Response.json(
      { ok: false, message: "Please check the form.", errors: fieldErrors },
      { status: 400 }
    )
  }

  const { fullName, email, blurb, linkedinUrl } = parsed.data
  const db = supabaseAdmin()

  // Per-email rate limit (defends against targeting one address).
  const emailLimit = await rateLimit(`join:email:${email}`, 3, 60 * 60)
  if (!emailLimit.ok) return Response.json(GENERIC_OK)

  // Validate optional résumé up front.
  const resume = form.get("resume")
  let resumeFile: File | null = null
  if (resume instanceof File && resume.size > 0) {
    if (!ALLOWED_RESUME_TYPES.includes(resume.type as never)) {
      return Response.json(
        { ok: false, message: "Résumé must be a PDF or Word document." },
        { status: 400 }
      )
    }
    if (resume.size > MAX_RESUME_BYTES) {
      return Response.json(
        { ok: false, message: "Résumé must be under 5 MB." },
        { status: 400 }
      )
    }
    resumeFile = resume
  }

  // Look up any existing row for this email.
  const { data: existing, error: existingError } = await db
    .from("candidates")
    .select("id, status")
    .eq("email", email)
    .maybeSingle()
  if (existingError) {
    console.error("[join] lookup failed", existingError.message)
    return Response.json(
      { ok: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }

  // Already confirmed: do nothing, but tell the user they are already in.
  if (existing?.status === "confirmed") return Response.json(ALREADY_CONFIRMED_OK)

  // Upsert the candidate (insert new, or refresh a still-pending one).
  let candidateId: string
  if (existing) {
    candidateId = existing.id
    const { error } = await db
      .from("candidates")
      .update({ full_name: fullName, blurb, linkedin_url: linkedinUrl || null, signup_ip: ip, signup_user_agent: userAgent, ingest_status: "pending" })
      .eq("id", candidateId)
    if (error) {
      console.error("[join] update failed", error.message)
      return Response.json(
        { ok: false, message: "Something went wrong. Please try again." },
        { status: 500 }
      )
    }
  } else {
    const { data: inserted, error } = await db
      .from("candidates")
      .insert({
        email,
        full_name: fullName,
        blurb,
        linkedin_url: linkedinUrl || null,
        signup_ip: ip,
        signup_user_agent: userAgent,
        status: "pending",
      })
      .select("id")
      .single()
    if (error || !inserted) {
      console.error("[join] insert failed", error?.message)
      return Response.json(
        { ok: false, message: "Something went wrong. Please try again." },
        { status: 500 }
      )
    }
    candidateId = inserted.id
  }

  // Handle résumé: upload to private bucket + extract text now.
  if (resumeFile) {
    try {
      const ext =
        resumeFile.type === "application/pdf"
          ? "pdf"
          : resumeFile.type ===
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ? "docx"
            : "doc"
      const path = `${candidateId}/resume.${ext}`
      const buf = await resumeFile.arrayBuffer()
      const { error: uploadError } = await db.storage.from("resumes").upload(path, buf, {
        contentType: resumeFile.type,
        upsert: true,
      })
      if (uploadError) throw new Error(uploadError.message)
      const text = await extractResumeText(buf, resumeFile.type)
      const { error: resumeUpdateError } = await db
        .from("candidates")
        .update({ resume_path: path, resume_text: text })
        .eq("id", candidateId)
      if (resumeUpdateError) throw new Error(resumeUpdateError.message)
    } catch (err) {
      console.error("[join] résumé handling failed", err)
      // Non-fatal: proceed without résumé text.
    }
  }

  // Fresh confirmation token (hash stored; raw emailed). Invalidate old ones.
  const { raw, hash } = generateToken()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const { error: deleteTokenError } = await db
    .from("confirmation_tokens")
    .delete()
    .eq("candidate_id", candidateId)
  if (deleteTokenError) {
    console.error("[join] token cleanup failed", deleteTokenError.message)
    return Response.json(
      { ok: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
  const { error: tokenError } = await db.from("confirmation_tokens").insert({
    candidate_id: candidateId,
    token_hash: hash,
    expires_at: expiresAt,
  })
  if (tokenError) {
    console.error("[join] token insert failed", tokenError.message)
    return Response.json(
      { ok: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }

  try {
    await sendConfirmationEmail({ id: candidateId, email, full_name: fullName }, raw)
  } catch (err) {
    console.error("[join] email send failed", err)
    // Still respond generically; the user can retry.
  }

  // Ingest immediately (after the response) so the profile is analysis-ready
  // the moment they confirm — but it is never exposed until confirmation.
  after(async () => {
    await ingestCandidate(candidateId)
  })

  return Response.json(GENERIC_OK)
}
