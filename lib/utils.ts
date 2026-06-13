import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Parse a pgvector value (returned as a JSON-ish string) into a number[]. */
export function parseEmbedding(value: string | null): number[] | null {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}
