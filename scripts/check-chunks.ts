/* eslint-disable no-console */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

async function main() {
  console.log('Checking chunks table page numbers...\n');

  const { data, error } = await supabase
    .from('chunks')
    .select('source, page, content')
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Sample chunks:');
  data?.forEach((chunk, idx) => {
    console.log(`\n${idx + 1}. Source: ${chunk.source}`);
    console.log(`   Page: ${chunk.page}`);
    console.log(`   Content preview: ${chunk.content.slice(0, 100)}...`);
  });

  // Check if any chunks have null pages
  const { count: nullCount } = await supabase
    .from('chunks')
    .select('*', { count: 'exact', head: true })
    .is('page', null);

  const { count: totalCount } = await supabase
    .from('chunks')
    .select('*', { count: 'exact', head: true });

  console.log(`\n\nSummary:`);
  console.log(`Total chunks: ${totalCount}`);
  console.log(`Chunks with page=null: ${nullCount}`);
  console.log(`Chunks with page numbers: ${(totalCount || 0) - (nullCount || 0)}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
