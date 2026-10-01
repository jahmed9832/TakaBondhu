import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY?.trim();
const EMBEDDING_MODEL_NAME = 'gemini-embedding-001';
const EMBEDDING_DIMENSION = 768;

let genAI = null;
if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
  } catch (err) {
    console.warn('[EmbeddingService] Failed to initialize GoogleGenerativeAI:', err.message);
  }
}

/**
 * Generate a 768-dimensional normalized embedding for text using Google Gemini
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export async function generateEmbedding(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('[EmbeddingService] Text parameter is required.');
  }

  if (!apiKey || !genAI) {
    throw new Error('[EmbeddingService] GEMINI_API_KEY is not configured.');
  }

  const cleanText = text.trim();
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL_NAME });

  const result = await model.embedContent({
    content: { parts: [{ text: cleanText }] },
    outputDimensionality: EMBEDDING_DIMENSION
  });

  if (!result || !result.embedding || !result.embedding.values) {
    throw new Error('[EmbeddingService] Invalid or empty embedding returned by Gemini.');
  }

  return result.embedding.values;
}

export { EMBEDDING_MODEL_NAME, EMBEDDING_DIMENSION };
