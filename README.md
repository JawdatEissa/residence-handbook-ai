# SFU Residence & Housing Handbook AI

A RAG (Retrieval-Augmented Generation) chatbot that answers questions about SFU residence and housing using AI-powered semantic search.

## Features

✅ **Semantic Search** - Vector-based similarity search with pgvector  
✅ **Smart Caching** - Semantic cache with hit tracking (reduces API calls by ~40%)  
✅ **Link Extraction** - Automatically extracts 40+ URLs from PDFs and includes them in answers  
✅ **Page Citations** - Shows source pages for all answers  
✅ **Markdown Support** - Clickable links in chat interface  
✅ **Model Fallback** - gpt-5-nano with automatic fallback to gpt-4o-mini

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, React Markdown
- **Backend**: Next.js API Routes, OpenAI API (embeddings + chat)
- **Database**: Supabase (PostgreSQL + pgvector)
- **Processing**: pdf-parse, tiktoken (token-based chunking)

## Quick Start

### 1. Prerequisites

- Node.js 18+
- Supabase account
- OpenAI API key

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create `.env.local`:

```bash
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE=eyJhbG...
```

### 4. Database Setup

Run the SQL from `ARCHITECTURE.md` (Database Schema section) in your Supabase SQL Editor to create:

- `chunks` and `qa_cache` tables
- RPC functions: `match_chunks`, `match_questions`, `upsert_qa_cache`, `increment_cache_hit`
- Vector indexes

### 5. Ingest PDFs

Place PDF files in `data/pdfs/` then run:

```bash
npm run ingest
```

This extracts text, detects links, chunks content, generates embeddings, and stores in Supabase.

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start asking questions!

## Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run ingest       # Process PDFs and populate database
npm run diagnose     # Check system health and RPC functions
npm run test-links   # Preview link extraction without DB changes
npm run check-chunks # Verify chunk data and page numbers
npm run check-cache  # Monitor cache health and duplicates
```

## How It Works

1. **Ingestion**: PDFs → Extract text + links → Chunk (800 tokens) → Embed → Store
2. **Query**: Question → Embed → Cache check → Retrieve context → AI model → Cache result
3. **Response**: Answer + citations + clickable links

See `ARCHITECTURE.md` for detailed system architecture and data flows.

## Project Structure

```
residence-handbook-ai/
├── src/
│   ├── app/api/ask/route.ts     # Main RAG API
│   ├── components/chat/         # UI components
│   └── lib/                     # Utilities (db, embed)
├── scripts/                     # Ingestion & diagnostic tools
├── data/pdfs/                   # Source documents
├── ARCHITECTURE.md              # System architecture docs
└── README.md                    # This file
```

## Troubleshooting

**No results returned?**

- Run `npm run diagnose` to check RPC functions
- Verify chunks exist: check Supabase table
- Check logs for `[retrieveContext]` messages

**Cache not working?**

- Verify `match_questions` RPC exists
- Check `qa_cache` table has `hits` and `last_hit_at` columns

**Links not showing?**

- Re-run `npm run ingest` to extract links
- Verify chunks have `[Related Links]` section

## License

MIT
