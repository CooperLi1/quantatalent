"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { cn } from "@/lib/utils"
import { ALLOWED_RESUME_TYPES, MAX_RESUME_BYTES } from "@/lib/validation"

interface JoinCtx {
  open: () => void
}
const Ctx = createContext<JoinCtx | null>(null)

export function useJoin() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useJoin must be used within JoinProvider")
  return ctx
}

export function JoinProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  return (
    <Ctx.Provider value={{ open }}>
      {children}
      {isOpen && <JoinModal onClose={close} />}
    </Ctx.Provider>
  )
}

export function JoinTrigger({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const { open } = useJoin()
  return (
    <button type="button" onClick={open} className={className}>
      {children}
    </button>
  )
}

type FieldErrors = Partial<Record<"fullName" | "email" | "blurb" | "linkedinUrl", string[]>>

function JoinModal({ onClose }: { onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)
  const dropRef = useRef<HTMLLabelElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Lock scroll + escape to close.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  function validateFile(f: File): boolean {
    setFileError(null)
    if (!ALLOWED_RESUME_TYPES.includes(f.type as never)) {
      setFileError("PDF or Word document only.")
      return false
    }
    if (f.size > MAX_RESUME_BYTES) {
      setFileError("Must be under 5 MB.")
      return false
    }
    return true
  }

  async function onFile(f: File | null) {
    setPreview(null)
    if (!f) return setFile(null)
    if (!validateFile(f)) return
    setFile(f)
    // Free, extraction-only read-back (PDF). Shows the AI already "sees" them.
    if (f.type === "application/pdf") {
      setParsing(true)
      try {
        const fd = new FormData()
        fd.append("resume", f)
        const res = await fetch("/api/parse-resume", { method: "POST", body: fd })
        const data = await res.json()
        if (data.preview) setPreview(data.preview)
      } catch {
        /* non-fatal */
      } finally {
        setParsing(false)
      }
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError(null)
    setErrors({})
    try {
      const fd = new FormData(formRef.current!)
      if (file) fd.set("resume", file)
      const res = await fetch("/api/join", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) {
        setErrors(data.errors ?? {})
        setError(data.message ?? "Something went wrong.")
        return
      }
      setDone(true)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="modal-scrollbar fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-4 backdrop-blur-sm sm:items-center sm:py-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Request to join"
    >
      <div className={cn("join-modal-card modal-scrollbar", done && "join-modal-card--compact")}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="join-close"
        >
          ✕
        </button>

        {done ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-accent/30 text-accent">
              ✓
            </div>
            <h2 className="text-xl font-medium text-foreground">Check your inbox</h2>
            <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted">
              We sent a confirmation link to your email. Click it to complete your
              request and enter the community.
            </p>
          </div>
        ) : (
          <div className="join-modal-layout">
            <div>
              <div className="label">Request access</div>
              <h2 className="join-modal-title">Join the community</h2>
              <p className="join-modal-copy">
                For people who have reached the top 0.01% of a field — and the scouts
                who find them.
              </p>
            </div>

            <form ref={formRef} onSubmit={onSubmit} className="join-form" noValidate>
              <div className="join-form-grid">
                <Field label="Full name" error={errors.fullName?.[0]}>
                  <input name="fullName" type="text" autoComplete="name" required className={inputCls} />
                </Field>
                <Field label="Email" error={errors.email?.[0]}>
                  <input name="email" type="email" autoComplete="email" required className={inputCls} />
                </Field>
                <Field
                  label="Why you're exceptional & why you want in"
                  error={errors.blurb?.[0]}
                  className="join-form-full"
                >
                  <textarea
                    name="blurb"
                    rows={3}
                    required
                    className={cn(inputCls, "join-textarea")}
                    placeholder="Proof of reaching the top of a field, what you're building toward…"
                  />
                </Field>
                <Field label="LinkedIn (optional)" error={errors.linkedinUrl?.[0]}>
                  <input
                    name="linkedinUrl"
                    type="url"
                    inputMode="url"
                    placeholder="https://linkedin.com/in/…"
                    className={inputCls}
                  />
                </Field>

                {/* Resume dropzone (optional) */}
                <div>
                  <span className="label">Resume (optional)</span>
                  <label
                    ref={dropRef}
                    onDragOver={(e) => {
                      e.preventDefault()
                      dropRef.current?.classList.add("is-dragging")
                    }}
                    onDragLeave={() => dropRef.current?.classList.remove("is-dragging")}
                    onDrop={(e) => {
                      e.preventDefault()
                      dropRef.current?.classList.remove("is-dragging")
                      onFile(e.dataTransfer.files?.[0] ?? null)
                    }}
                    className="join-dropzone"
                  >
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => onFile(e.target.files?.[0] ?? null)}
                    />
                    <span className="join-dropzone-main">
                      <span className={cn("join-dropzone-value", file && "is-selected")}>
                        {file ? file.name : "PDF or Word"}
                      </span>
                      {parsing && <span className="join-dropzone-status">Reading…</span>}
                      {preview && (
                        <span className="join-dropzone-preview">
                          Read you as: {preview}
                        </span>
                      )}
                    </span>
                    <span className="join-dropzone-action">{file ? "Change" : "Upload"}</span>
                  </label>
                  {fileError && <p className="mt-1 text-xs text-red-400">{fileError}</p>}
                </div>

                {/* Honeypot — hidden from humans, tempting to bots. */}
                <div aria-hidden className="absolute left-[-9999px] top-[-9999px]">
                  <label>
                    Company
                    <input name="company" type="text" tabIndex={-1} autoComplete="off" />
                  </label>
                </div>

                {error && <p className="join-form-full text-sm text-red-400">{error}</p>}

                <button type="submit" disabled={submitting} className="join-submit join-form-full">
                  {submitting ? "Sending…" : "Request to join"}
                </button>
                <p className="join-policy join-form-full">
                  By requesting access you agree to our{" "}
                  <a href="/privacy">
                    privacy policy
                  </a>
                  .
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

const inputCls = "join-input"

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string
  error?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn("join-field", className)}>
      <span className="label">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
    </label>
  )
}
