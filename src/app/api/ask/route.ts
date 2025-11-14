// src/app/api/ask/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase, supabaseAdmin } from "@/lib/db";
import { embedText } from "@/lib/embed";

// -------------------------------
// Types
// -------------------------------
type Citation = {
  source: string | null;
  page: number | null;
  section: string | null;
};

type AskBody = {
  question?: string;
};

// -------------------------------
// Rate Limit (very simple, in-memory)
// -------------------------------
const MODEL_MAX_CALLS = process.env.NODE_ENV === "production" ? 20 : 60;
const MODEL_WINDOW_MS = 60_000;
const buckets = new Map<string, { t: number; n: number }>();

function hitLimit(ip: string) {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now - b.t > MODEL_WINDOW_MS) {
    buckets.set(ip, { t: now, n: 1 });
    return false;
  }
  b.n += 1;
  return b.n > MODEL_MAX_CALLS;
}

// -------------------------------
// Helpers
// -------------------------------

/**
 * Extract text from an OpenAI Responses API response in a robust way.
 */
function extractText(resp: any): string {
  // Newer SDKs provide output_text directly
  const direct = (resp?.output_text ?? "").trim();
  if (direct) return direct;

  // Fallback over output array content
  if (Array.isArray(resp?.output)) {
    const pieces: string[] = [];
    for (const item of resp.output) {
      if (Array.isArray(item?.content)) {
        for (const c of item.content) {
          if (typeof c?.text === "string") pieces.push(c.text);
        }
      }
    }
    const joined = pieces.join("\n").trim();
    if (joined) return joined;
  }

  return "";
}

/**
 * Simple system instruction used for answer generation.
 * Adjust to your tone/policy needs.
 */
const SYSTEM_RULES = `
You are SFU Residence & Housing handbook assistant.
Answer ONLY using the provided handbook excerpts. If the answer is not present, say you cannot find it in the materials provided. 
Be concise and precise. Use bullet points when listing items.
DO NOT include source references or page numbers in your answer - they will be added automatically as citations.

IMPORTANT: If the provided context includes any URLs or links (often in a [Related Links] section), and those links are relevant to answering the question, you MUST include them at the end of your answer.
Format links in Markdown style for clickability: [Descriptive Text](URL)
Example: [Submit Maintenance Request](https://example.com/maintenance)
`;

/**
 * Build the prompt including retrieved context chunks.
 */
function buildPrompt(question: string, contextBlocks: string[]): string {
  const header = `### Task
Answer the user question strictly from the provided handbook context. If missing, state that you cannot find it in the provided materials.

### Question
${question.trim()}

### Context (excerpts)
${contextBlocks.length > 0 ? contextBlocks.map((b, i) => `Excerpt ${i + 1}:\n${b}`).join("\n\n") : "(no excerpts found)"}

### Output format
- Direct answer (3–8 bullet points if appropriate).
- Do NOT add any source notes or citations in your answer text.
- If the excerpts contain relevant URLs/links (especially in [Related Links] sections), include them AFTER your bullet points.
- Format links in Markdown: **Helpful Link:** [Descriptive Title](URL)
- Example: **Helpful Link:** [Submit Maintenance Request Online](https://www.sfu.ca/students/...)
- Use descriptive, user-friendly link text like "Submit Request Online", "View Parking Options", "Contact Housing Services" - NOT the raw URL.
`;
  return `${SYSTEM_RULES}\n${header}`;
}

/**
 * Ask a model once.
 */
async function askOnce(model: string, input: string, maxTokens: number) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  
  // gpt-5-nano doesn't support temperature parameter, only gpt-4o and mini do
  const requestParams: any = {
    model,
    input,
    max_output_tokens: maxTokens,
  };
  
  // Only add temperature for models that support it
  if (model.includes('gpt-4') || model.includes('mini')) {
    requestParams.temperature = 0.2;
  }
  
  const resp = await openai.responses.create(requestParams);
  return extractText(resp);
}

/**
 * Try semantic cache hit using an RPC, if available.
 * This will silently skip if the RPC doesn't exist or errors.
 */
async function trySemanticCache(
  qEmbedding: number[],
  threshold = 0.9
): Promise<{ hit: boolean; answer?: string; citations?: Citation[]; id?: string }> {
  try {
    const { data, error } = await supabase.rpc("match_questions", {
      query_embedding: qEmbedding,
      match_threshold: 0.7, // get a few candidates; we enforce 0.9 ourselves
      match_count: 5,
    });

    if (error || !Array.isArray(data) || data.length === 0) {
      console.log('[trySemanticCache] No cache match found or RPC error:', error?.message || 'no results');
      return { hit: false };
    }

    const best = data[0];
    const similarity = typeof best?.similarity === "number" ? best.similarity : 0;
    console.log('[trySemanticCache] Best match similarity:', similarity, 'threshold:', threshold);
    
    if (similarity >= threshold && best?.answer) {
      return {
        hit: true,
        answer: best.answer as string,
        citations: (best.citations as Citation[]) ?? [],
        id: best.id as string,
      };
    }

    return { hit: false };
  } catch (e) {
    console.warn('[trySemanticCache] Error:', e);
    return { hit: false };
  }
}

/**
 * Try to retrieve context chunks from a sections/embeddings RPC.
 * If your RPC/table is named differently, adapt below.
 * Silently degrades to empty context if RPC is missing.
 */
async function retrieveContext(
  qEmbedding: number[],
  maxChunks = 6
): Promise<{ blocks: string[]; citations: Citation[] }> {
  try {
    console.log('[retrieveContext] Calling match_chunks RPC with embedding length:', qEmbedding.length);
    
    const { data, error } = await supabase.rpc("match_chunks", {
      query_embedding: qEmbedding,
      match_count: maxChunks,
    });

    if (error) {
      console.error('[retrieveContext] RPC error:', error);
      return { blocks: [], citations: [] };
    }

    if (!Array.isArray(data)) {
      console.warn('[retrieveContext] RPC returned non-array data:', typeof data);
      return { blocks: [], citations: [] };
    }

    console.log('[retrieveContext] Retrieved', data.length, 'chunks from match_chunks');
    
    if (data.length === 0) {
      console.warn('[retrieveContext] No matching chunks found - check if chunks table has data and RPC exists');
    }

    // Expect each row to have 'content' and some source metadata (file, page, section)
    const blocks: string[] = [];
    const cites: Citation[] = [];

    for (const row of data) {
      const content: string = (row?.content ?? "").toString();
      if (content) blocks.push(content);

      cites.push({
        source: (row?.source ?? row?.file ?? "Residence_and_Housing_Handbook2025.pdf") as string,
        page: typeof row?.page === "number" ? row.page : null,
        section: (row?.section ?? null) as string | null,
      });
    }

    return { blocks, citations: cites };
  } catch {
    return { blocks: [], citations: [] };
  }
}

/**
 * Deduplicate citations by combining pages from the same source.
 * Returns unique citations with page numbers.
 */
function deduplicateCitations(citations: Citation[]): Citation[] {
  const sourceMap = new Map<string, Set<number>>();
  
  for (const cite of citations) {
    const source = cite.source || "Residence_and_Housing_Handbook2025.pdf";
    if (!sourceMap.has(source)) {
      sourceMap.set(source, new Set());
    }
    if (cite.page !== null && cite.page !== undefined) {
      sourceMap.get(source)!.add(cite.page);
    }
  }
  
  const result: Citation[] = [];
  for (const [source, pages] of sourceMap.entries()) {
    const sortedPages = Array.from(pages).sort((a, b) => a - b);
    result.push({
      source,
      page: sortedPages.length > 0 ? sortedPages[0] : null, // Use first page as representative
      section: sortedPages.length > 1 
        ? `Pages ${sortedPages.join(", ")}` 
        : sortedPages.length === 1 
          ? `Page ${sortedPages[0]}`
          : null
    });
  }
  
  return result;
}

/**
 * Best-effort cache insert (never throws and never blocks the response).
 * Uses upsert to avoid duplicates.
 */
async function cacheInsert(
  question: string,
  qEmbedding: number[],
  finalAnswer: string,
  citations: Citation[],
  docVersion: string | number = "v2025"
) {
  try {
    // Try to use the upsert function if it exists
    const { error } = await supabaseAdmin.rpc('upsert_qa_cache', {
      p_question: question,
      p_q_embedding: qEmbedding,
      p_answer: finalAnswer,
      p_citations: citations,
      p_doc_version: String(docVersion),
    });

    if (error) {
      // Fallback to regular insert if upsert function doesn't exist
      console.warn('[cacheInsert] Upsert failed, using regular insert:', error.message);
      await supabaseAdmin.from("qa_cache").insert({
        question,
        q_embedding: qEmbedding,
        answer: finalAnswer,
        citations,
        doc_version: docVersion,
      });
    } else {
      console.log('[cacheInsert] Successfully cached question:', question.slice(0, 50));
    }
  } catch (e) {
    console.warn('[cacheInsert] Cache insert failed:', e);
    // ignore - caching is best-effort
  }
}

/**
 * Increment cache hit counter
 */
async function incrementCacheHit(cacheId: string) {
  try {
    const { error } = await supabaseAdmin.rpc('increment_cache_hit', {
      cache_id: cacheId,
    });
    if (error) {
      console.warn('[incrementCacheHit] Failed to increment:', error.message);
    } else {
      console.log('[incrementCacheHit] Hit counter incremented for cache ID:', cacheId.slice(0, 8));
    }
  } catch (e) {
    console.warn('[incrementCacheHit] Error:', e);
    // ignore - best effort
  }
}

// -------------------------------
// Route
// -------------------------------

export async function POST(req: NextRequest) {
  try {
    // Rate limit (by IP) — NextRequest has no .ip, so read from headers
    const forwarded = req.headers.get("x-forwarded-for");
    const ip =
      forwarded?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    if (hitLimit(ip)) {
      return NextResponse.json(
        { error: "Too many AI requests, try again soon." },
        { status: 429 }
      );
    }

    // Parse body
    const body: AskBody = await req.json().catch(() => ({}));
    const question = (body?.question ?? "").trim();

    if (!question) {
      return NextResponse.json(
        { error: "Missing 'question' in request body." },
        { status: 400 }
      );
    }

    // Create question embedding
    const qEmbedding = await embedText(question);

    // Validate embedding early so RPCs / model calls don't receive an empty vector
    if (!Array.isArray(qEmbedding) || qEmbedding.length === 0) {
      console.error('Failed to create embedding for question:', question);
      return NextResponse.json(
        { error: "Failed to create embedding for the question. Please try rephrasing." },
        { status: 500 }
      );
    }

    // Try semantic cache hit (return immediately if confident)
    const cache = await trySemanticCache(qEmbedding, 0.9);
    if (cache.hit && cache.id) {
      console.log('[POST /api/ask] Cache HIT! Returning cached answer');
      // Increment hit counter in background (don't wait)
      incrementCacheHit(cache.id).catch(() => {});
      
      return NextResponse.json(
        {
          answer: cache.answer!,
          citations: cache.citations ?? [],
          cached: true,
        },
        { status: 200 }
      );
    }

    // Retrieve context (best-effort; may return empty)
    const { blocks, citations } = await retrieveContext(qEmbedding, 6);

    console.log('[POST /api/ask] Retrieved', blocks.length, 'context blocks for question:', question.slice(0, 100));
    
    // Build prompt
    const prompt = buildPrompt(question, blocks);

    // Ask fast model, then fallback once on error or empty response
    let answerText = "";
    try {
      answerText = await askOnce("gpt-5-nano", prompt, 220);
    } catch (e) {
      console.error('Primary model call failed (gpt-5-nano):', e);
      // try fallback model before giving up
      try {
        answerText = await askOnce("gpt-4o-mini", prompt, 300);
      } catch (e2) {
        console.error('Fallback model call failed (gpt-4o-mini):', e2);
        const msg =
          process.env.NODE_ENV === "production"
            ? "AI service unavailable."
            : (e2 as any)?.message ?? String(e2);
        return NextResponse.json({ error: msg }, { status: 503 });
      }
    }

    // If the model returned an empty string, try a single fallback with the other model
    if (!answerText) {
      try {
        answerText = await askOnce("gpt-4o-mini", prompt, 300);
      } catch (e) {
        console.error('Fallback on empty response failed:', e);
      }
    }

    // If still empty, return a graceful 200 so UI does not show a generic error
    if (!answerText) {
      return NextResponse.json(
        {
          answer:
            "I couldn’t compose an answer from the provided residence materials.",
          citations: [],
          cached: false,
        },
        { status: 200 }
      );
    }

    // Final answer and citations (keep whatever the model returned; we also include retrieved citations)
    const finalAnswer = answerText.trim();
    const finalCitations = deduplicateCitations(citations);

    // Best-effort cache insert using service-role client
    cacheInsert(question, qEmbedding, finalAnswer, finalCitations).catch(() => {});

    return NextResponse.json(
      {
        answer: finalAnswer,
        citations: finalCitations,
        cached: false,
      },
      { status: 200 }
    );
  } catch (err: any) {
    // Log the full error server-side for debugging.
    console.error('Unhandled /api/ask error:', err);

    // In development return the error message to the client to aid debugging.
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
    }

    // Production: keep error message generic to avoid leaking internals.
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
