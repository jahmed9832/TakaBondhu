/**
 * TakaBondhu - Voice Agent Scam Analysis Tool
 * Connects the LiveKit voice assistant directly into the existing multi-tier
 * Scam Shield intelligence: Deterministic Rule Engine + Supabase pgvector RAG.
 */

import { tool } from '@livekit/agents';
import { runDeterministicRuleEngine } from '../ruleEngine.js';
import { retrieveRelevantKnowledge } from '../ragService.js';

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

    // RAG Layer: Retrieve Trusted Safety Guidance
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

    const hasCriticalSignals = candidateSignals.some(s => s.severity === 'CRITICAL' || s.severity === 'HIGH');
    const isPotentialScam = candidateSignals.length > 0 || hasCriticalSignals;
    
    let riskLevel = 'LOW';
    if (deterministic.baseScore >= 80) riskLevel = 'CRITICAL';
    else if (deterministic.baseScore >= 60) riskLevel = 'HIGH';
    else if (deterministic.baseScore >= 35) riskLevel = 'MEDIUM';

    // Build concise next step
    const safeNextStep = isPotentialScam
      ? 'টাকা পাঠাবেন না, কোনো ওটিপি বা পিন নম্বর দেবেন না। কলটি সাথে সাথে কেটে দিন এবং ব্যাংক বা সংশ্লিষ্ট প্রতিষ্ঠানের অফিশিয়াল হেল্পলাইনে নিজে ফোন করে যাচাই করুন।'
      : 'স্বাভাবিক সতর্কতা বজায় রাখুন। কখনো কারো সাথে পাসওয়ার্ড বা পিন শেয়ার করবেন না।';

    const resultPayload = {
      isPotentialScam,
      riskLevel,
      riskScore: deterministic.baseScore,
      signalsDetected: candidateSignals.map(s => ({
        type: s.type,
        severity: s.severity,
        evidence: s.evidence,
        explanation: s.explanation
      })),
      ragAvailable,
      ragStatusNotice: ragAvailable 
        ? `Retrieved ${ragDocs.length} trusted safety guidelines from TakaBondhu Knowledge Base.`
        : `RAG safety knowledge is temporarily unavailable (${ragReason}). Analysis grounded using Deterministic Rule Engine.`,
      retrievedSafetyGuidance: ragDocs.map(d => ({
        title: d.title,
        category: d.category,
        content: d.content
      })),
      safestPracticalNextStep: safeNextStep
    };

    console.log(`[Voice Agent] Scam analysis complete. Status: ${isPotentialScam ? 'POTENTIAL SCAM' : 'SAFE'}, Risk: ${riskLevel}`);
    console.log(`======================================================\n`);

    return resultPayload;
  }
});
