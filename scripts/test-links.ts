/* eslint-disable no-console */
/**
 * Test script to preview link extraction from PDFs
 * Run: npm run test-links
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'node:fs/promises';
import path from 'node:path';
import pdf from 'pdf-parse';

/**
 * Extract URLs/links from PDF text content.
 */
function extractLinks(text: string): string[] {
  const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  const matches = text.match(urlPattern) || [];
  
  const cleanedLinks = matches.map(link => {
    return link.replace(/[.,;:)\]}>]+$/, '');
  }).filter(link => {
    return link.length > 5 && !link.endsWith('...');
  });
  
  return [...new Set(cleanedLinks)];
}

async function main() {
  const pdfDir = path.join(process.cwd(), 'data', 'pdfs');
  const files = (await fs.readdir(pdfDir)).filter(f => f.toLowerCase().endsWith('.pdf'));
  
  if (files.length === 0) {
    console.log('No PDFs found in /data/pdfs');
    return;
  }

  for (const file of files) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📄 ${file}`);
    console.log('='.repeat(60));
    
    const full = path.join(pdfDir, file);
    const buf = await fs.readFile(full);
    const parsed = await pdf(buf);
    
    const rawText = typeof parsed?.text === 'string' ? parsed.text : String(parsed?.text ?? '');
    const links = extractLinks(rawText);
    
    console.log(`\nFound ${links.length} unique links:\n`);
    
    if (links.length === 0) {
      console.log('❌ No links found. The PDF might not contain URLs or they may be in annotations/metadata.');
    } else {
      links.forEach((link, idx) => {
        console.log(`${idx + 1}. ${link}`);
      });
    }
    
    // Show some context around the first link
    if (links.length > 0) {
      const firstLink = links[0];
      const idx = rawText.indexOf(firstLink);
      if (idx > -1) {
        const contextStart = Math.max(0, idx - 80);
        const contextEnd = Math.min(rawText.length, idx + firstLink.length + 80);
        const context = rawText.slice(contextStart, contextEnd);
        console.log(`\n📝 Context around first link:\n"...${context}..."`);
      }
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
