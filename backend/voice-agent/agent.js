/**
 * TakaBondhu - Realtime Voice AI Agent (LiveKit + Google Gemini + RAG)
 * Speaks natural Bangla and assists users in detecting financial scams in realtime.
 */

import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { cli, defineAgent, voice, ServerOptions } from '@livekit/agents';
import * as google from '@livekit/agents-plugin-google';
import { VOICE_AGENT_INSTRUCTIONS } from './instructions.js';
import { scamAnalysisTool } from './scamTool.js';
import { ragKnowledgeTool } from './ragTool.js';

dotenv.config();

// LiveKit Agent Name for explicit dispatch routing
process.env.LIVEKIT_AGENT_NAME = process.env.LIVEKIT_AGENT_NAME || 'scamshield-voice';

// LiveKit Google plugin expects GOOGLE_API_KEY for Gemini Live audio
if (!process.env.GOOGLE_API_KEY && process.env.GEMINI_API_KEY) {
  process.env.GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
}

export default defineAgent({
  entry: async (ctx) => {
    console.log(`[VOICE DEBUG] Agent worker received job for room: ${ctx.room.name || 'unnamed'}`);
    console.log(`[VOICE DEBUG] Agent joining room: ${ctx.room.name || 'unnamed'}`);
    
    // Connect agent to the LiveKit room
    await ctx.connect();
    console.log(`[VOICE DEBUG] Agent joined room successfully: ${ctx.room.name}`);

    // Google Realtime plugin reads GOOGLE_API_KEY
    const googleApiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!googleApiKey) {
      console.error('[Voice Agent] ⚠️ GOOGLE_API_KEY / GEMINI_API_KEY is not set in backend/.env!');
    }

    // Configure Google Gemini Realtime Model with supported live preview model
    const realtimeModel = new google.realtime.RealtimeModel({
      model: process.env.GEMINI_VOICE_MODEL || 'gemini-3.1-flash-live-preview',
      apiKey: googleApiKey,
      voice: 'Aoede', // Natural, friendly voice
      language: 'bn',  // Bangla language code
      instructions: VOICE_AGENT_INSTRUCTIONS
    });

    // Create the voice agent session
    const session = new voice.AgentSession({
      llm: realtimeModel
    });

    // Create the Agent with Scam Shield intelligence tools
    const agent = new voice.Agent({
      instructions: VOICE_AGENT_INSTRUCTIONS,
      tools: [scamAnalysisTool, ragKnowledgeTool]
    });

    // Event listeners for safe logging & tracking
    session.on(voice.AgentSessionEventTypes.UserInputTranscribed, (ev) => {
      if (ev.transcript && ev.transcript.trim()) {
        console.log(`[Voice Agent] User speech transcribed: "${ev.transcript.slice(0, 80)}..."`);
      }
    });

    session.on(voice.AgentSessionEventTypes.AgentStateChanged, (ev) => {
      console.log(`[Voice Agent] Agent state changed: ${ev.state}`);
      if (ev.state === 'speaking') {
        console.log(`[Voice Agent] Response spoken`);
      }
    });

    session.on(voice.AgentSessionEventTypes.Error, (ev) => {
      console.error(`[Voice Agent] Session error:`, ev.error?.message || ev.error);
    });

    // Start the agent in the room
    await session.start({
      agent,
      room: ctx.room
    });

    console.log(`[VOICE DEBUG] Agent session started in room: ${ctx.room.name}`);

    // Spoken Bangla initial greeting
    try {
      session.say('আসসালামু আলাইকুম! আমি TakaBondhu-র Voice AI Assistant। কোনো আর্থিক মেসেজ বা সন্দেহজনক ফোন কল নিয়ে সন্দেহ হলে আমাকে বলুন, আমি নিরাপদ পরবর্তী পদক্ষেপ নিতে সাহায্য করব।');
      console.log(`[Voice Agent] Initial Bangla greeting dispatched.`);
    } catch (greetErr) {
      console.warn(`[Voice Agent] Notice during greeting dispatch:`, greetErr.message);
    }
  }
});

// Run as a standalone worker CLI when invoked directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  cli.runApp(new ServerOptions({ 
    agent: fileURLToPath(import.meta.url),
    agentName: 'scamshield-voice'
  }));
}
