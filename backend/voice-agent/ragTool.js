/**
 * TakaBondhu - Voice Agent RAG Tool
 * Connects the voice pipeline to the existing Supabase pgvector safety knowledge base.
 */

import { tool, getJobContext } from '@livekit/agents';
import { retrieveRelevantKnowledge } from '../ragService.js';

export const ragKnowledgeTool = tool({
  name: 'retrieve_safety_knowledge',
  description: 'Retrieve curated safety guidance and anti-fraud knowledge documents from the trusted TakaBondhu Safety Knowledge Base based on a topic, scam keyword, or suspicious financial scenario.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query or scam topic (e.g., "bKash account blocked", "lottery prize fee", "OTP harvesting", "courier customs fee").'
      }
    },
    required: ['query']
  },
  execute: async ({ query }) => {
    console.log(`[Voice Agent] RAG retrieval started for query: "${query?.slice(0, 50)}..."`);
    
    try {
      const ragResult = await retrieveRelevantKnowledge(query, 3);
      
      if (!ragResult.success || !ragResult.documents || ragResult.documents.length === 0) {
        console.log(`[Voice Agent] RAG documents retrieved: 0 (Status: unavailable or empty)`);
        return {
          available: false,
          reason: ragResult.reason || 'No matching safety guidelines found in knowledge base.',
          guidelines: []
        };
      }

      console.log(`[Voice Agent] RAG documents retrieved: ${ragResult.documents.length}`);
      
      try {
        const jobCtx = getJobContext(false);
        if (jobCtx?.room?.localParticipant) {
          const payload = new TextEncoder().encode(JSON.stringify({
            type: 'rag_status',
            data: {
              available: true,
              count: ragResult.documents.length,
              guidelines: ragResult.documents.map(d => ({ title: d.title, category: d.category }))
            }
          }));
          jobCtx.room.localParticipant.publishData(payload, { reliable: true }).catch(() => {});
        }
      } catch {}

      return {
        available: true,
        documentCount: ragResult.documents.length,
        guidelines: ragResult.documents.map(d => ({
          title: d.title,
          category: d.category,
          rules: d.content
        }))
      };
    } catch (err) {
      console.warn(`[Voice Agent] ⚠️ Error in RAG retrieval tool:`, err.message);
      return {
        available: false,
        reason: 'RAG service temporarily unavailable.',
        guidelines: []
      };
    }
  }
});
