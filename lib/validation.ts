import { z } from "zod"

/**
 * Server-side validation for the "request to join" form.
 * Mirrored loosely on the client for UX, but this is the source of truth.
 */
export const joinSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Please enter your full name.")
    .max(120, "That name is too long."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email.")
    .max(254),
  blurb: z
    .string()
    .trim()
    .min(40, "Tell us a little more — at least a sentence or two.")
    .max(2000, "Please keep this under 2000 characters."),
  linkedinUrl: z
    .string()
    .trim()
    .url("That doesn't look like a valid URL.")
    .refine(
      (u) => /(^https?:\/\/)?([\w-]+\.)*linkedin\.com\//i.test(u),
      "Please enter a LinkedIn profile URL."
    )
    .optional()
    .or(z.literal("")),
  // Honeypot: must be empty. Bots tend to fill every field.
  company: z.string().max(0).optional(),
})

export type JoinInput = z.infer<typeof joinSchema>

export const ALLOWED_RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const

export const MAX_RESUME_BYTES = 5 * 1024 * 1024 // 5 MB
