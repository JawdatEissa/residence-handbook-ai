/* eslint-disable no-console */
/**
 * Check qa_cache schema
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

async function main() {
  console.log('Checking qa_cache table structure...\n');

  // Get a sample row to see the schema
  const { data, error } = await supabase
    .from('qa_cache')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('qa_cache columns:', Object.keys(data[0]));
    console.log('\nSample row:', data[0]);
  } else {
    console.log('No rows in qa_cache table');
  }

  // Check for duplicates manually
  console.log('\nChecking for duplicate questions...');
  const { data: allQuestions } = await supabase
    .from('qa_cache')
    .select('question, id, hits, created_at')
    .order('question');
  
  if (allQuestions) {
    const questionMap = new Map<string, number>();
    allQuestions.forEach(q => {
      const count = questionMap.get(q.question) || 0;
      questionMap.set(q.question, count + 1);
    });
    
    console.log('\nQuestion counts:');
    let foundDuplicates = false;
    questionMap.forEach((count, question) => {
      if (count > 1) {
        console.log(`"${question}": ${count} duplicates`);
        foundDuplicates = true;
      }
    });
    
    if (!foundDuplicates) {
      console.log('✅ No duplicates found!');
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
