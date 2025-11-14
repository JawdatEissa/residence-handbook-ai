// src/lib/embed.ts
import OpenAI from "openai";

/**
 * Create a single embedding vector for a text string.
 * We keep this isolated so the rest of the app can call it without repeating boilerplate.
 */
export async function embedText(text: string): Promise<number[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  // Normalize whitespace to reduce tiny differences that hurt cache recall.
  const cleaned = (text ?? "").replace(/\s+/g, " ").trim();
  if (!cleaned) return [];

  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: cleaned,
  });

  const vec = res.data?.[0]?.embedding ?? [];
  return vec;
}
