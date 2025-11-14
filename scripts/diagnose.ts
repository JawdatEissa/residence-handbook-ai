/* eslint-disable no-console */
/**
 * Diagnostic script to check Supabase setup and data
 * Run: npm run diagnose
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { embedText } from '../src/lib/embed';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

async function main() {
  console.log('=== Supabase Diagnostic ===\n');

  // 1. Check if chunks table exists and has data
  console.log('1. Checking chunks table...');
  const { data: chunks, error: chunksError, count } = await supabase
    .from('chunks')
    .select('*', { count: 'exact', head: false })
    .limit(5);

  if (chunksError) {
    console.error('❌ Error accessing chunks table:', chunksError);
  } else {
    console.log(`✅ chunks table exists with ${count} total rows`);
    if (chunks && chunks.length > 0) {
      console.log('   Sample chunk:', {
        source: chunks[0].source,
        contentLength: chunks[0].content?.length || 0,
        hasEmbedding: !!chunks[0].embedding,
        embeddingDim: Array.isArray(chunks[0].embedding) ? chunks[0].embedding.length : 'N/A'
      });
    }
  }

  // 2. Check if qa_cache table exists
  console.log('\n2. Checking qa_cache table...');
  const { error: cacheError, count: cacheCount } = await supabase
    .from('qa_cache')
    .select('*', { count: 'exact', head: true });

  if (cacheError) {
    console.warn('⚠️  qa_cache table error (optional):', cacheError.message);
  } else {
    console.log(`✅ qa_cache table exists with ${cacheCount} rows`);
  }

  // 3. Test embedding generation
  console.log('\n3. Testing embedding generation...');
  try {
    const testEmbed = await embedText('test question');
    console.log(`✅ Embedding created, dimension: ${testEmbed.length}`);
  } catch (e: any) {
    console.error('❌ Embedding failed:', e.message);
  }

  // 4. Check if match_chunks RPC exists and works
  console.log('\n4. Testing match_chunks RPC...');
  try {
    const testQuery = await embedText('how to file a maintenance request');
    const { data, error } = await supabase.rpc('match_chunks', {
      query_embedding: testQuery,
      match_count: 3
    });

    if (error) {
      console.error('❌ match_chunks RPC error:', error);
    } else {
      console.log(`✅ match_chunks RPC works, returned ${Array.isArray(data) ? data.length : 0} results`);
      if (data && data.length > 0) {
        console.log('   Top match similarity:', data[0].similarity);
        console.log('   Top match content preview:', data[0].content?.slice(0, 100));
      } else {
        console.warn('⚠️  RPC works but returned 0 results - chunks might be empty or embeddings not matching');
        
        // Let's check a sample chunk directly
        const { data: sampleChunk } = await supabase
          .from('chunks')
          .select('content, embedding')
          .limit(1)
          .single();
        
        if (sampleChunk) {
          console.log('   Sample chunk content exists:', !!sampleChunk.content);
          console.log('   Sample chunk embedding exists:', !!sampleChunk.embedding);
        }
      }
    }
  } catch (e: any) {
    console.error('❌ RPC test failed:', e.message);
  }

  // 5. Check if match_questions RPC exists (optional cache)
  console.log('\n5. Testing match_questions RPC (optional)...');
  try {
    const testQuery = await embedText('how to file a maintenance request');
    const { data, error } = await supabase.rpc('match_questions', {
      query_embedding: testQuery,
      match_threshold: 0.7,
      match_count: 5
    });

    if (error) {
      console.warn('⚠️  match_questions RPC not found (optional):', error.message);
    } else {
      console.log(`✅ match_questions RPC works, returned ${Array.isArray(data) ? data.length : 0} cached results`);
    }
  } catch (e: any) {
    console.warn('⚠️  match_questions test failed (optional):', e.message);
  }

  console.log('\n=== Diagnostic Complete ===');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
