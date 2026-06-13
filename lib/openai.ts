import "server-only"

import OpenAI from "openai"
import { env } from "@/lib/env"

let client: OpenAI | null = null
export function openai(): OpenAI {
  if (!client) client = new OpenAI({ apiKey: env.openaiKey })
  return client
}

// Cheap, capable defaults. Both are low-cost per the cost model in the README.
export const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini"
export const EMBED_MODEL = "text-embedding-3-small" // 1536 dims
export const EMBED_DIMS = 1536

/** Single embedding call. Input is truncated by the caller to bound cost. */
export async function embed(text: string): Promise<number[]> {
  const res = await openai().embeddings.create({
    model: EMBED_MODEL,
    input: text.slice(0, 8000),
  })
  return res.data[0].embedding
}

/** Format a JS number[] into the pgvector text literal Postgres expects. */
export function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(",")}]`
}
