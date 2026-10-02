/**
 * TakaBondhu - Voice Agent Scam Analysis Tool
 * Connects the LiveKit voice assistant directly into the unified
 * Scam Shield intelligence: Deterministic Rule Engine + Local ML Model + Supabase pgvector RAG.
 * Uses the exact same scoring pipeline (backend/scoring.js) as the text API.
 */

import { tool } from '@livekit/agents';
import { runDeterministicRuleEngine } from '../ruleEngine.js';
import { retrieveRelevantKnowledge } from '../ragService.js';
import { predictScam } from '../mlClient.js';
import { computeHybridScore } from '../scoring.js';

export const scamAnalysisTool = tool({
  name: 'analyze_scam_situation',
  description: 'Analyze a user\'s described financial situation, suspicious phone call, or message. Runs the deterministic rule engine to extract objective threat signals and retrieves curated safety guidelines from the TakaBondhu RAG knowledge base.',
  parameters: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'The user\'s described situation, call transcript, or message content in English or Bangla.'
      }
    },
    required: ['message']
  },
  execute: async ({ message }) => {
    const trimmed = (message || '').trim();
    console.log(`\n======================================================`);
    console.log(`[Voice Agent] User speech received (${trimmed.length} chars)`);
    console.log(`[Voice Agent] Scam analysis started`);

    // Tier 1: Deterministic Rule Engine
    const deterministic = runDeterministicRuleEngine(trimmed);
    const candidateSignals = deterministic.rawSignals || [];
    console.log(`[Voice Agent] Rule engine detected ${candidateSignals.length} threat signal(s).`);

    // Tier 2: Local ML Service (FastAPI)
    let mlResult = { status: 'unavailable' };
    try {
      mlResult = await predictScam(trimmed);
      console.log(`[Voice Agent] ML prediction status: ${mlResult.status}, prob: ${mlResult.probability}`);
    } catch (mlErr) {
      console.warn(`[Voice Agent] ML predict error: ${mlErr.message}`);
    }

    // Unified Scoring (pure code computation)
    const hybrid = computeHybridScore({
      rulesResult: deterministic,
      mlResult: mlResult,
      llmAdjustment: 0,
      llmIsScam: null
    });

    // RAG Layer: Retrieve Curated Safety Guidance
    console.log(`[Voice Agent] RAG retrieval started`);
    let ragDocs = [];
    let ragAvailable = false;
    let ragReason = null;

    try {
      const ragResult = await retrieveRelevantKnowledge(trimmed, 3);
      if (ragResult.success && Array.isArray(ragResult.documents) && ragResult.documents.length > 0) {
        ragDocs = ragResult.documents;
        ragAvailable = true;
        console.log(`[Voice Agent] RAG documents retrieved: ${ragDocs.length}`);
      } else {
        ragReason = ragResult.reason || 'No matching safety documents in knowledge base';
        console.log(`[Voice Agent] RAG documents retrieved: 0 (${ragReason})`);
      }
    } catch (ragErr) {
      ragReason = ragErr.message;
      console.warn(`[Voice Agent] ⚠️ RAG retrieval failed: ${ragErr.message}`);
    }

    const isPotentialScam = hybrid.isFlagged;
    const riskLevel = hybrid.riskLevel;
    const riskScore = hybrid.finalScore;

    // Concise next step guidance in Bangla
    const safeNextStep = isPotentialScam
      ? 'টাকা পাঠাবেন না, কোনো ওটিপি বা পিন নম্বর দেবেন না। কলটি সাথে সাথে কেটে দিন এবং ব্যাংক বা সংশ্লিষ্ট প্রতিষ্ঠানের অফিশিয়াল হেল্পলাইনে নিজে ফোন করে যাচাই করুন।'
      : 'স্বাভাবিক সতর্কতা বজায় রাখুন। কখনো কারো সাথে পাসওয়ার্ড বা পিন শেয়ার করবেন না।';

    const resultPayload = {
      isPotentialScam,
      riskLevel,
      riskScore,
      scoring: hybrid.scoring,
      ml: hybrid.ml,
      case_card: hybrid.case_card,
      needs_human_review: hybrid.needsHumanReview,
      signalsDetected: candidateSignals.map(s => ({
        type: s.type,
        severity: s.severity,
        evidence: s.evidence,
        explanation: s.explanation
      })),
      ragAvailable,
      ragStatusNotice: ragAvailable
        ? `Retrieved ${ragDocs.length} curated safety guidelines from TakaBondhu Knowledge Base.`
        : `RAG safety knowledge is temporarily unavailable (${ragReason}). Analysis grounded using Deterministic Rule Engine and ML.`,
      retrievedSafetyGuidance: ragDocs.map(d => ({
        title: d.title,
        category: d.category,
        content: d.content
      })),
      safestPracticalNextStep: safeNextStep
    };

    console.log(`[Voice Agent] Scam analysis complete. Status: ${isPotentialScam ? 'POTENTIAL SCAM' : 'SAFE'}, Risk: ${riskLevel} (${riskScore}/100)`);
    console.log(`======================================================\n`);

    return resultPayload;
  }
});
