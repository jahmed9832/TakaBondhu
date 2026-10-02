/**
 * TakaBondhu — Knowledge Ingestion Script
 * Embeds and stores curated safety documents in Supabase pgvector table 'knowledge_documents'.
 * 
 * Usage:
 *   npm run ingest-knowledge
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { KNOWLEDGE_DOCUMENTS } from './knowledgeBase.js';
import { generateEmbedding, EMBEDDING_MODEL_NAME, EMBEDDING_DIMENSION } from './embeddingService.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const secretKey = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.SUPABASE_ANON_KEY?.trim();
const supabaseKey = secretKey || publishableKey;

async function runIngestion() {
  console.log('================================================================');
  console.log('📚 TakaBondhu — Safety Knowledge Base Ingestion');
  console.log(`Using Embedding Model: ${EMBEDDING_MODEL_NAME} (${EMBEDDING_DIMENSION}-dim)`);
  console.log('================================================================\n');

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase Configuration in backend/.env:');
    console.error('   Please provide SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_PUBLISHABLE_KEY).');
    console.error('   Example:');
    console.error('     SUPABASE_URL=https://your-project-id.supabase.co');
    console.error('     SUPABASE_SECRET_KEY=sb_secret_...');
    console.error('\nAlso ensure you have run supabase/schema.sql in your Supabase SQL editor.\n');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  console.log(`✓ Supabase connection initialized.`);
  console.log(`Found ${KNOWLEDGE_DOCUMENTS.length} curated documents in TakaBondhu Safety Knowledge Base.\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < KNOWLEDGE_DOCUMENTS.length; i++) {
    const doc = KNOWLEDGE_DOCUMENTS[i];
    const indexStr = `[${i + 1}/${KNOWLEDGE_DOCUMENTS.length}]`;

    try {
      console.log(`${indexStr} Embedding document "${doc.title}" (${doc.category})...`);
      
      // Combine title, category, and content for embedding text
      const textToEmbed = `${doc.title}\nCategory: ${doc.category}\n\n${doc.content}`;
      const embedding = await generateEmbedding(textToEmbed);

      console.log(`   ✓ Vector generated (${embedding.length} dimensions). Upserting into Supabase...`);

      // Upsert document to avoid duplicates
      const { error } = await supabase
        .from('knowledge_documents')
        .upsert(
          {
            id: doc.id,
            title: doc.title,
            category: doc.category,
            source: doc.source,
            excerpt: doc.excerpt,
            content: doc.content,
            embedding: embedding,
            created_at: new Date().toISOString()
          },
          { onConflict: 'id' }
        );

      if (error) {
        console.error(`   ❌ Supabase Upsert Failed: ${error.message}`);
        failCount++;
      } else {
        console.log(`   ✓ Successfully stored: ${doc.id}`);
        successCount++;
      }

      // Small pause between embeddings to prevent burst rate limits
      await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      console.error(`   ❌ Failed processing "${doc.title}":`, err.message);
      failCount++;
    }
  }

  console.log('\n================================================================');
  console.log(`🏁 Ingestion Finished: ${successCount} succeeded, ${failCount} failed.`);
  console.log('================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runIngestion().catch(err => {
  console.error('Fatal ingestion error:', err);
  process.exit(1);
});
