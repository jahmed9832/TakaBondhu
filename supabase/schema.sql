-- ====================================================================
-- TakaBondhu — Supabase pgvector RAG Schema Migration
-- ====================================================================
-- INSTRUCTIONS FOR SETUP:
-- 1. Open your Supabase Project Dashboard (https://supabase.com/dashboard)
-- 2. Select your project and navigate to the "SQL Editor" in the left sidebar
-- 3. Click "New Query", paste this entire script, and click "RUN"
-- 4. Once executed, run 'npm run ingest-knowledge' from the project terminal
-- ====================================================================

-- 1. Enable the pgvector extension to support high-dimensional vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the knowledge_documents table
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'TakaBondhu Safety Knowledge Base',
    excerpt TEXT,
    content TEXT NOT NULL,
    embedding VECTOR(768), -- Matches Google gemini-embedding-001 (768-dim output)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Create an HNSW index for ultra-fast cosine similarity vector search
CREATE INDEX IF NOT EXISTS knowledge_documents_embedding_idx
ON public.knowledge_documents
USING hnsw (embedding vector_cosine_ops);

-- 4. Create the similarity search function (RPC) for TakaBondhu RAG retrieval
CREATE OR REPLACE FUNCTION public.search_knowledge(
    query_embedding VECTOR(768),
    match_count INT DEFAULT 3,
    similarity_threshold FLOAT DEFAULT 0.25
)
RETURNS TABLE (
    id TEXT,
    title TEXT,
    category TEXT,
    content TEXT,
    source TEXT,
    excerpt TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kd.id,
        kd.title,
        kd.category,
        kd.content,
        kd.source,
        kd.excerpt,
        (1 - (kd.embedding <=> query_embedding))::FLOAT AS similarity
    FROM public.knowledge_documents kd
    WHERE (1 - (kd.embedding <=> query_embedding)) > similarity_threshold
    ORDER BY kd.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 5. Row-Level Security (RLS) policies
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;

-- Allow read access for public / anon client querying
CREATE POLICY "Allow public read access to knowledge documents"
ON public.knowledge_documents
FOR SELECT
USING (true);

-- Allow service_role to insert, update, delete for knowledge ingestion
CREATE POLICY "Allow service_role full management access"
ON public.knowledge_documents
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
