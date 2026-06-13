import "server-only"

import { extractText, getDocumentProxy } from "unpdf"

const MAX_RESUME_TEXT = 20000 // chars persisted / sent to the model

/**
 * Extract plain text from an uploaded résumé. PDFs are parsed with unpdf
 * (serverless-friendly, no native deps). DOC/DOCX are not text-extracted
 * here — we keep the file and fall back to the user's blurb for analysis.
 */
export async function extractResumeText(
  buffer: ArrayBuffer,
  mimeType: string
): Promise<string | null> {
  try {
    if (mimeType === "application/pdf") {
      const pdf = await getDocumentProxy(new Uint8Array(buffer))
      const { text } = await extractText(pdf, { mergePages: true })
      const clean = text.replace(/\s+\n/g, "\n").replace(/[ \t]{2,}/g, " ").trim()
      return clean.slice(0, MAX_RESUME_TEXT) || null
    }
    return null
  } catch (err) {
    console.error("[resume] extraction failed", err)
    return null
  }
}
