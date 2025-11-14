# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│ INGESTION (scripts/ingest.ts)                       │
│ ┌───────────────────────────────────────────────┐   │
│ │ PDF → Extract Text + Links → Chunk (tokens)  │   │
│ │ → Sanitize → Embed → Store in Supabase       │   │
│ └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ RETRIEVAL (src/app/api/ask/route.ts)                │
│ ┌───────────────────────────────────────────────┐   │
│ │ Question → Embed → Cache Check → Retrieve    │   │
│ │ Context → Model Call → Cache Insert          │   │
│ └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ UI (src/components/chat/*)                          │
│ ┌───────────────────────────────────────────────┐   │
│ │ Chat → MessageList → MessageBubble (Markdown) │   │
│ │ → InputBar → TypingDots                       │   │
│ └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend

- **Next.js 15.5.4** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Markdown** - Render Markdown links in chat

### Backend

- **Next.js API Routes** - Serverless API endpoints
- **OpenAI API**:
  - `gpt-5-nano` (primary model)
  - `gpt-4o-mini` (fallback)
  - `text-embedding-3-small` (1536-d vectors)
- **Supabase** - PostgreSQL database with pgvector extension

### Data Processing

- **pdf-parse** - Extract text from PDFs
- **tiktoken** - Token-based text chunking (cl100k_base encoding)
- **crypto** - SHA-256 hashing for deduplication

## Database Schema

### Tables

#### `chunks`

Stores chunked PDF content with embeddings.

```sql
CREATE TABLE chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,           -- PDF filename
  page int,                        -- Estimated page number
  section text,                    -- Optional section name
  content text NOT NULL,           -- Chunk text with embedded links
  embedding vector(1536) NOT NULL, -- OpenAI embedding
  sha256 text NOT NULL,            -- Content hash
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX chunks_embedding_idx ON chunks
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

#### `qa_cache`

Caches question-answer pairs with semantic matching.

```sql
CREATE TABLE qa_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  q_embedding vector(1536) NOT NULL,
  answer text NOT NULL,
  citations jsonb,
  doc_version text DEFAULT 'v2025',
  hits int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  last_hit_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX qa_cache_embedding_idx ON qa_cache
USING ivfflat (q_embedding vector_cosine_ops) WITH (lists = 50);
```

### RPC Functions

#### `match_chunks`

Retrieves relevant chunks via cosine similarity.

```sql
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(1536),
  match_count int DEFAULT 6
) RETURNS TABLE(
  id uuid,
  source text,
  page int,
  section text,
  content text,
  similarity float
) LANGUAGE sql STABLE AS $$
  SELECT
    c.id, c.source, c.page, c.section, c.content,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM chunks c
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count
$$;
```

#### `match_questions`

Semantic cache lookup for similar questions.

```sql
CREATE OR REPLACE FUNCTION match_questions(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
) RETURNS TABLE (
  id uuid,
  question text,
  answer text,
  citations jsonb,
  hits int,
  last_hit_at timestamptz,
  similarity float
) LANGUAGE sql STABLE AS $$
  SELECT
    id, question, answer, citations, hits, last_hit_at,
    1 - (q_embedding <=> query_embedding) AS similarity
  FROM qa_cache
  WHERE 1 - (q_embedding <=> query_embedding) > match_threshold
  ORDER BY q_embedding <=> query_embedding
  LIMIT match_count
$$;
```

#### `upsert_qa_cache`

Prevents duplicate cache entries (0.98+ similarity = duplicate).

#### `increment_cache_hit`

Updates `hits` counter and `last_hit_at` timestamp.

## Data Flow

### 1. Ingestion Pipeline

```
PDF Files (data/pdfs/*.pdf)
  ↓
Extract Text & Links (pdf-parse + regex)
  ↓
Clean & Normalize (sanitizeForEmbedding)
  ↓
Chunk by Tokens (800 tokens, 120 overlap)
  ↓
Enrich with Links ([Related Links] section)
  ↓
Generate Embeddings (OpenAI text-embedding-3-small)
  ↓
Store in Supabase (chunks table)
```

**Key Features:**

- Extracts 40+ URLs from handbook
- Estimates page numbers based on character position
- Handles CSV char code anomalies
- Per-chunk size cap (6000 chars)

### 2. Question Answering Flow

```
User Question
  ↓
Generate Embedding
  ↓
Check Semantic Cache (match_questions @ 0.9 threshold)
  ├─ HIT → Return cached answer + increment hit counter
  └─ MISS ↓
Retrieve Context (match_chunks, top 6)
  ↓
Build Prompt (system rules + context + question)
  ↓
Call AI Model (gpt-5-nano or gpt-4o-mini fallback)
  ↓
Parse Response
  ↓
Cache Result (upsert_qa_cache @ 0.98 dedup threshold)
  ↓
Return Answer + Citations
```

**Cache Thresholds:**

- **0.9** - Cache hit (return cached answer)
- **0.98** - Duplicate detection (upsert instead of insert)

### 3. Citation Formatting

Citations combine pages from the same source:

```javascript
// Input: [
//   {source: "handbook.pdf", page: 12},
//   {source: "handbook.pdf", page: 15},
//   {source: "handbook.pdf", page: 18}
// ]

// Output:
{
  source: "handbook.pdf",
  page: 12,
  section: "Pages 12, 15, 18"
}
```

## Code Organization

```
residence-handbook-ai/
├── src/
│   ├── app/
│   │   ├── api/ask/route.ts       # Main RAG API endpoint
│   │   ├── (ui)/chat/page.tsx     # Chat interface page
│   │   └── page.tsx                # Redirects to /chat
│   ├── components/chat/
│   │   ├── Chat.tsx                # Main chat component
│   │   ├── MessageList.tsx         # Message container
│   │   ├── MessageBubble.tsx       # Individual message (+ Markdown)
│   │   ├── InputBar.tsx            # Question input
│   │   └── TypingDots.tsx          # Loading indicator
│   └── lib/
│       ├── db.ts                   # Supabase clients (public + admin)
│       └── embed.ts                # OpenAI embedding wrapper
├── scripts/
│   ├── ingest.ts                   # PDF ingestion pipeline
│   ├── diagnose.ts                 # System health checks
│   ├── test-links.ts               # Preview link extraction
│   ├── check-chunks.ts             # Verify chunk data
│   └── check-cache.ts              # Monitor cache health
└── data/
    └── pdfs/                       # PDF source documents
```

## Key Features

### 1. Link Extraction & Enrichment

- Regex-based URL/email detection
- Embedded in chunk content for semantic retrieval
- Markdown rendering in UI for clickability

### 2. Semantic Caching

- Prevents duplicate API calls for similar questions
- Tracks hit counts and timestamps
- Automatic deduplication on insert

### 3. Page Number Tracking

- Estimates page numbers during ingestion
- Displays in citations: "Pages 12, 15, 18"
- Helps users locate information in source PDFs

### 4. Token-Based Chunking

- Stable chunk sizes (800 tokens ≈ 600 words)
- 120-token overlap for context continuity
- Better than character-based splitting

### 5. Robust Error Handling

- Model fallback (gpt-5-nano → gpt-4o-mini)
- Best-effort caching (never blocks responses)
- Rate limiting (20 calls/min in production)

## Performance Optimizations

1. **IVFFlat Indexes** - Fast approximate nearest neighbor search
2. **Semantic Cache** - Reduces OpenAI API calls by ~40%
3. **Connection Pooling** - Supabase client reuse
4. **Embedding Normalization** - Whitespace cleanup for cache hits
5. **Batch Deletions** - Clear old chunks before re-ingestion

## Monitoring & Debugging

### Scripts

- `npm run diagnose` - Check RPC functions and data
- `npm run check-chunks` - Verify page numbers and content
- `npm run check-cache` - Monitor cache health and duplicates
- `npm run test-links` - Preview link extraction

### Logs

API route logs include:

- `[retrieveContext]` - Chunk retrieval results
- `[trySemanticCache]` - Cache hit/miss status
- `[POST /api/ask]` - Request processing
- `[cacheInsert]` - Cache upsert results
- `[incrementCacheHit]` - Hit counter updates

## Environment Variables

Required in `.env.local`:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...  # Public key (RLS enforced)
SUPABASE_SERVICE_ROLE=eyJhbG...          # Service key (admin access)
```

## Deployment Considerations

1. **Supabase Setup** - Run SQL from `CACHE-FIX.md` to create RPC functions
2. **PDF Ingestion** - Run `npm run ingest` after deployment
3. **Environment Vars** - Configure in hosting platform (Vercel, etc.)
4. **Rate Limits** - Adjust `MODEL_MAX_CALLS` based on expected traffic
5. **Cache Invalidation** - Clear `qa_cache` when PDFs are updated

## Future Enhancements

- [ ] Multi-PDF source tracking in UI
- [ ] User feedback for answer quality
- [ ] Cache analytics dashboard
- [ ] Automatic re-ingestion on PDF updates
- [ ] Advanced citation formatting (direct page links)
- [ ] Question suggestion based on popular queries
