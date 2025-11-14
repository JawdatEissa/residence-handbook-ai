/* eslint-disable no-console */
/**
 * Enhanced PDF ingestion with link extraction → Supabase (pgvector)
 * - Loads .env.local (OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE)
 * - Extracts text AND hyperlinks from /data/pdfs/*.pdf
 * - Embeds links inline with context for better retrieval
 * - Splits by TOKENS with tiktoken (stable budgets vs. chars)
 * - Embeds with OpenAI text-embedding-3-small (1536-d)
 * - Inserts into 'chunks' table (content with links, embedding, source, sha256, page/section)
 *
 * Run:  npm run ingest
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// ---- fail fast if envs missing
for (const k of ['OPENAI_API_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE'] as const) {
  if (!process.env[k]) throw new Error(`Missing ${k} in .env.local`);
}

// ---- imports
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import pdf from 'pdf-parse';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { get_encoding } from 'tiktoken';

// ---- clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE! // service key (server-side only)
);

// ----------------- helpers -----------------

/**
 * Extract URLs/links from PDF text content.
 * This captures both explicit URLs and email addresses.
 */
function extractLinks(text: string): string[] {
  const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  const matches = text.match(urlPattern) || [];
  
  // Clean up and deduplicate
  const cleanedLinks = matches.map(link => {
    // Remove trailing punctuation that's not part of the URL
    return link.replace(/[.,;:)\]}>]+$/, '');
  }).filter(link => {
    // Filter out very short or invalid looking URLs
    return link.length > 5 && !link.endsWith('...');
  });
  
  return [...new Set(cleanedLinks)]; // Remove duplicates
}

/**
 * Enhanced function to enrich text with detected links.
 * Appends a "Related Links:" section if links are found in the text.
 */
function enrichTextWithLinks(text: string): string {
  const links = extractLinks(text);
  
  if (links.length === 0) {
    return text;
  }
  
  // Append links section to the chunk
  const linksSection = `\n\n[Related Links]\n${links.map(link => `- ${link}`).join('\n')}`;
  return text + linksSection;
}

/** Detect CSV of char codes like "32,119,104,..." and convert to string. */
function maybeFromCsvCodes(s: string): string {
  const csvish = /^(?:\s*\d{1,6}\s*,){30,}\s*\d{1,6}\s*$/.test(s);
  if (!csvish) return s;
  const parts = s.split(',').slice(0, 20000); // safety cap
  let out = '';
  for (const p of parts) {
    const n = parseInt(p.trim(), 10);
    if (Number.isFinite(n) && n >= 9 && n <= 0x10ffff) {
      try {
        out += String.fromCodePoint(n);
      } catch {
        /* skip invalid codepoints */
      }
    }
  }
  return out;
}

/** Clean text for embedding/model consumption. */
function sanitizeForEmbedding(raw: unknown): string {
  let s = typeof raw === 'string' ? raw : String(raw ?? '');
  
  // First, decode CSV char codes if present
  s = maybeFromCsvCodes(s);
  
  s = s
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ') // control chars (keep \n \t)
    .replace(/[\uD800-\uDFFF]/g, ' ')                  // stray surrogates
    .replace(/\uFEFF/g, ' ')                           // BOM
    .replace(/\u00A0/g, ' ')                           // NBSP
    .replace(/[\u2000-\u200F\u2028\u2029\u202A-\u202E\u2060-\u206F]/g, ' ') // invisibles/bidi
    .normalize('NFKC')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
  
  return s;
}

/** Clean individual chunk for embedding (with size cap). */
function sanitizeChunk(raw: unknown): string {
  let s = sanitizeForEmbedding(raw);
  // Cap individual chunks only (not the full document)
  if (s.length > 6000) s = s.slice(0, 6000);
  return s;
}

/** Token-based splitter using tiktoken (stable vs char-based). */
function chunkByTokens(text: string, maxTokens = 800, overlap = 120): string[] {
  const enc = get_encoding('cl100k_base');
  try {
    const toks = enc.encode(text); // Uint32Array
    const step = Math.max(1, maxTokens - overlap);
    const chunks: string[] = [];
    for (let i = 0; i < toks.length; i += step) {
      const end = Math.min(toks.length, i + maxTokens);
      const slice = toks.subarray(i, end); // Uint32Array view

      // tiktoken TS defs can be narrow; runtime accepts Uint32Array.
      // @ts-expect-error decode accepts Uint32Array at runtime
      const decoded: string = enc.decode(slice);
      chunks.push(decoded);
    }
    return chunks;
  } finally {
    enc.free();
  }
}

/** One embedding call (returns 1536-d vector). */
async function embedOnce(text: string): Promise<number[]> {
  const resp = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  });
  return resp.data[0].embedding as unknown as number[];
}

// ----------------- main -----------------

async function main() {
  const pdfDir = path.join(process.cwd(), 'data', 'pdfs');
  const files = (await fs.readdir(pdfDir)).filter(f => f.toLowerCase().endsWith('.pdf'));
  if (files.length === 0) throw new Error('No PDFs found in /data/pdfs');

  // Delete existing chunks before re-ingesting
  console.log('Deleting existing chunks...');
  const { error: deleteError } = await supabase.from('chunks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (deleteError) {
    console.warn('Could not delete old chunks:', deleteError.message);
  } else {
    console.log('✓ Old chunks deleted\n');
  }

  for (const file of files) {
    const full = path.join(pdfDir, file);
    const buf = await fs.readFile(full);
    const parsed = await pdf(buf);

    console.log(`\nProcessing ${file}:`);
    console.log(`  Total pages: ${parsed.numpages}`);

    // Get raw text and sanitize it
    const rawText = typeof parsed?.text === 'string' ? parsed.text : String(parsed?.text ?? '');
    const cleanedAll = sanitizeForEmbedding(rawText);
    
    console.log(`  Text length after cleaning: ${cleanedAll.length} chars`);
    console.log(`  Preview: ${cleanedAll.slice(0, 100).replace(/\n/g, ' ')}...`);
    
    // Extract links
    const documentLinks = extractLinks(cleanedAll);
    console.log(`  Found ${documentLinks.length} links`);
    if (documentLinks.length > 0) {
      console.log(`  Sample: ${documentLinks.slice(0, 2).join(', ')}`);
    }

    // Create chunks
    const chunks = chunkByTokens(cleanedAll, 800, 120);
    console.log(`  Creating ${chunks.length} chunks...`);

    const totalPages = parsed.numpages || 1;
    const charsPerPage = cleanedAll.length / totalPages;

    let inserted = 0;
    let skipped = 0;
    let charPosition = 0;

    for (let i = 0; i < chunks.length; i++) {
      const original = chunks[i];
      
      // Sanitize chunk with size cap
      let cleaned = sanitizeChunk(original);
      if (!/\S/.test(cleaned)) {
        skipped++;
        charPosition += original.length;
        continue;
      }

      // Add links
      const enriched = enrichTextWithLinks(cleaned);

      // Calculate page number
      const estimatedPage = Math.min(totalPages, Math.max(1, Math.ceil(charPosition / charsPerPage)));
      charPosition += original.length;

      // Embed
      let embedding: number[];
      try {
        embedding = await embedOnce(enriched);
      } catch (e) {
        console.error(`  Embed failed for chunk ${i + 1}:`, (e as Error).message);
        skipped++;
        continue;
      }

      const sha256 = crypto.createHash('sha256').update(enriched).digest('hex');

      const { error } = await supabase.from('chunks').insert({
        source: file,
        page: estimatedPage,
        section: null,
        content: enriched,
        embedding,
        sha256
      });

      if (error) throw error;
      inserted++;
    }

    console.log(`Finished ${file}: inserted=${inserted}, skipped=${skipped}`);
  }

  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
