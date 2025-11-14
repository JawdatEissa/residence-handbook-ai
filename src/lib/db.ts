// src/lib/db.ts
import { createClient } from "@supabase/supabase-js";

/**
 * Public client (RLS enforced).
 * Safe for reads/RPC from both server and client components.
 *
 * Uses NEXT_PUBLIC_* so it can be shipped to the browser when needed.
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

/**
 * Server-only admin client (NO RLS; has full access).
 * Use ONLY in server code (e.g., /api routes). Never import in client components.
 *
 * Requires SUPABASE_SERVICE_ROLE in .env.local (no NEXT_PUBLIC_ prefix).
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!, // service-role key
  { auth: { persistSession: false } }
);
