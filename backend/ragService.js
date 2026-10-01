import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { generateEmbedding, EMBEDDING_MODEL_NAME, EMBEDDING_DIMENSION } from './embeddingService.js';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL?.trim();

// Prefer current Supabase key naming convention, with backwards compatibility
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.SUPABASE_ANON_KEY?.trim();
const secretKey = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

// Use secret key if available (server-side authority), otherwise publishable key
const supabaseKey = secretKey || publishableKey;

const isConfigured = Boolean(supabaseUrl && supabaseKey);

let supabase = null;
if (isConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
    console.log('✓ Supabase client initialized for RAG knowledge retrieval.');
  } catch (err) {
    console.warn('⚠️ Could not initialize Supabase client:', err.message);
  }
} else {
  console.log('ℹ️ Supabase environment variables not configured. RAG will report as unavailable with graceful fallback.');
}

/**
 * Safe configuration diagnostics (never returns actual secret values)
 */
export function getSupabaseConfigDiagnostics() {
  return {
    urlConfigured: Boolean(supabaseUrl && supabaseUrl.length > 0),
    publishableKeyConfigured: Boolean(publishableKey && publishableKey.length > 0),
    secretKeyConfigured: Boolean(secretKey && secretKey.length > 0),
    clientActive: Boolean(supabase)
  };
}

/**
 * Returns whether Supabase credentials are configured in the environment
 */
export function isRagConfigured() {
  return isConfigured && Boolean(supabase);
}

/**
 * Ping Supabase and test if knowledge_documents table exists and has documents
 */
export async function checkRagHealth() {
  if (!isConfigured || !supabase) {
    return {
      configured: false,
      active: false,
      status: 'unavailable',
      reason: 'Supabase credentials not configured in backend/.env',
      model: `${EMBEDDING_MODEL_NAME} (${EMBEDDING_DIMENSION}-dim)`
    };
  }

  try {
    const { count, error } = await supabase
      .from('knowledge_documents')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return {
        configured: true,
        active: false,
        status: 'unavailable',
        reason: error.message,
        model: `${EMBEDDING_MODEL_NAME} (${EMBEDDING_DIMENSION}-dim)`
      };
    }

    return {
      configured: true,
      active: true,
      status: 'active',
      documentCount: count || 0,
      model: `${EMBEDDING_MODEL_NAME} (${EMBEDDING_DIMENSION}-dim)`
    };
  } catch (err) {
    return {
      configured: true,
      active: false,
      status: 'unavailable',
      reason: err.message,
      model: `${EMBEDDING_MODEL_NAME} (${EMBEDDING_DIMENSION}-dim)`
    };
  }
}

/**
 * Search the Supabase pgvector knowledge base for documents relevant to the query text
 * @param {string} queryText - User message or analysis context
 * @param {number} limit - Number of top documents to retrieve (default 3)
 * @returns {Promise<{ success: boolean, documents: Array, reason?: string }>}
 */
export async function retrieveRelevantKnowledge(queryText, limit = 3) {
  if (!isConfigured || !supabase) {
    return {
      success: false,
      documents: [],
      reason: 'Supabase credentials not configured'
    };
  }

  try {
    console.log(`[RAG Service] RAG retrieval started: "${queryText.slice(0, 60)}..."`);
    
    // 1. Generate query embedding (768 dimensions)
    const queryEmbedding = await generateEmbedding(queryText);

    // 2. Perform similarity search via Supabase RPC function 'search_knowledge'
    const { data, error } = await supabase.rpc('search_knowledge', {
      query_embedding: queryEmbedding,
      match_count: limit,
      similarity_threshold: 0.25
    });

    if (error) {
      console.warn(`[RAG Service] Supabase RPC error: ${error.message}`);
      return {
        success: false,
        documents: [],
        reason: error.message
      };
    }

    const documents = Array.isArray(data) ? data : [];
    console.log(`[RAG Service] Retrieved documents: ${documents.length}`);
    if (documents.length > 0) {
      console.log(`[RAG Service] Top category: ${documents[0].category}`);
    }

    return {
      success: documents.length > 0,
      documents: documents.map(d => ({
        id: d.id,
        title: d.title,
        category: d.category,
        source: d.source || 'TakaBachao Safety Knowledge Base',
        excerpt: d.excerpt || d.content.slice(0, 160) + '...',
        content: d.content,
        similarity: d.similarity ? Math.round(d.similarity * 100) : 85
      }))
    };
  } catch (err) {
    console.warn(`[RAG Service] Retrieval failed: ${err.message}`);
    return {
      success: false,
      documents: [],
      reason: err.message
    };
  }
}
