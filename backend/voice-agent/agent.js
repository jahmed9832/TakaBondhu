/**
 * TakaBondhu - Realtime Voice AI Agent (LiveKit + Google Gemini + RAG)
 * Speaks natural Bangla and assists users in detecting financial scams in realtime.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { cli, defineAgent, voice, ServerOptions } from '@livekit/agents';
import * as google from '@livekit/agents-plugin-google';
import { VOICE_AGENT_INSTRUCTIONS } from './instructions.js';
import { scamAnalysisTool } from './scamTool.js';
import { ragKnowledgeTool } from './ragTool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendEnv = path.resolve(__dirname, '../.env');
const rootEnv = path.resolve(__dirname, '../../.env');

if (fs.existsSync(backendEnv)) {
  dotenv.config({ path: backendEnv });
} else if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
} else {
  dotenv.config();
}

// Ensure worker processes use moderate heap suitable for both local dev and cloud containers
const heapLimit = process.env.NODE_MAX_MEM || (process.env.NODE_ENV === 'production' ? '128' : '2048');
if (!process.env.NODE_OPTIONS || !process.env.NODE_OPTIONS.includes('--max-old-space-size')) {
  process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ''} --max-old-space-size=${heapLimit}`.trim();
}

// LiveKit Agent Name for explicit dispatch routing
process.env.LIVEKIT_AGENT_NAME = process.env.LIVEKIT_AGENT_NAME || 'takabondhu-voice';

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

    // Helper to broadcast telemetry & transcripts to the client over LiveKit data channel
    const broadcastData = (data) => {
      try {
        if (ctx.room?.localParticipant) {
          const payload = new TextEncoder().encode(JSON.stringify(data));
          ctx.room.localParticipant.publishData(payload, { reliable: true }).catch(() => {});
        }
      } catch {}
    };

    // Event listeners for safe logging, tracking & client broadcasting
    session.on(voice.AgentSessionEventTypes.UserInputTranscribed, (ev) => {
      if (ev.transcript && ev.transcript.trim()) {
        console.log(`[Voice Agent] User speech transcribed: "${ev.transcript.slice(0, 80)}..."`);
        broadcastData({
          type: 'user_transcript',
          text: ev.transcript,
          isFinal: ev.isFinal
        });
      }
    });

    session.on(voice.AgentSessionEventTypes.ConversationItemAdded, (ev) => {
      if (ev.item && ev.item.content) {
        const text = typeof ev.item.content === 'string' ? ev.item.content : String(ev.item.content);
        if (ev.item.role === 'assistant') {
          console.log(`[Voice Agent] Assistant speech item: "${text.slice(0, 80)}..."`);
          broadcastData({
            type: 'agent_transcript',
            text
          });
        }
      }
    });

    session.on(voice.AgentSessionEventTypes.AgentStateChanged, (ev) => {
      console.log(`[Voice Agent] Agent state changed: ${ev.state}`);
      broadcastData({
        type: 'agent_state',
        state: ev.state
      });
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

    // Listen for data messages from frontend (Dual-channel text + audio turn handler)
    ctx.room.on('dataReceived', async (payload, participant) => {
      try {
        const raw = new TextDecoder().decode(payload);
        const msg = JSON.parse(raw);
        if (msg.type === 'user_speech_text' && msg.text && msg.text.trim()) {
          const userMsg = msg.text.trim();
          console.log(`[Voice Agent] Received user_speech_text via data channel: "${userMsg.slice(0, 60)}..."`);

          // 1. Run unified Scam Shield intelligence
          const analysis = await scamAnalysisTool.execute({ message: userMsg });

          // 2. Broadcast scam analysis payload so UI updates instantly
          broadcastData({
            type: 'scam_analysis',
            data: analysis
          });

          // 3. Instruct Gemini Realtime to reply via natural spoken Bangla
          const isScam = analysis.isPotentialScam;
          const riskLevel = analysis.riskLevel;
          const advice = analysis.safestPracticalNextStep;
          const signals = (analysis.signalsDetected || []).map(s => s.type).join(', ');

          const instructions = `The user spoke in Bangla: "${userMsg}".
Scam Shield Intelligence Assessment:
- Potential Scam: ${isScam ? 'YES (HIGH RISK)' : 'NO (BENIGN)'}
- Threat Level: ${riskLevel} (${analysis.riskScore}/100)
- Threat Signals: ${signals || 'None'}
- Safest Next Step: "${advice}"

Speak aloud immediately to the user in natural, polite Bengali (বাংলা) in 2 to 3 sentences:
1. State clearly whether this message or call is suspicious or safe.
2. Explain why (banks and mobile financial services never ask for OTP or threaten to close accounts over the phone).
3. Advise the safest practical next step: "${advice}".`;

          session.generateReply({ instructions });
          console.log(`[Voice Agent] Spoken Bangla reply dispatched for user speech.`);
        }
      } catch (dataErr) {
        console.warn(`[Voice Agent] Notice processing incoming data packet:`, dataErr.message);
      }
    });

    // Wait for the human user to connect to the room before triggering initial greeting
    try {
      console.log(`[Voice Agent] Waiting for participant in room: ${ctx.room.name}...`);
      await ctx.waitForParticipant();
      console.log(`[Voice Agent] Participant joined room ${ctx.room.name}. Triggering initial greeting.`);
      
      // Native audio models produce spoken speech via generateReply
      session.generateReply({
        instructions: 'Warmly greet the user in natural, polite Bengali (বাংলা): "আসসালামু আলাইকুম! আমি TakaBondhu-র Voice AI Assistant। কোনো আর্থিক মেসেজ বা সন্দেহজনক ফোন কল নিয়ে সন্দেহ হলে আমাকে বলুন, আমি নিরাপদ পরবর্তী পদক্ষেপ নিতে সাহায্য করব।"'
      });
      console.log(`[Voice Agent] Initial Bangla greeting generated.`);
    } catch (greetErr) {
      console.warn(`[Voice Agent] Notice during greeting dispatch:`, greetErr.message);
    }
  }
});

// Run as a standalone worker CLI when invoked directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const missingKeys = [];
  if (!process.env.LIVEKIT_URL) missingKeys.push('LIVEKIT_URL');
  if (!process.env.LIVEKIT_API_KEY) missingKeys.push('LIVEKIT_API_KEY');
  if (!process.env.LIVEKIT_API_SECRET) missingKeys.push('LIVEKIT_API_SECRET');
  if (missingKeys.length > 0) {
    console.error(`\x1b[31m[Voice Agent] Error: Missing required LiveKit environment variables: ${missingKeys.join(', ')}\x1b[0m`);
    console.error('[Voice Agent] Please ensure backend/.env or .env contains these keys.');
    process.exit(1);
  }

  cli.runApp(new ServerOptions({ 
    agent: fileURLToPath(import.meta.url),
    agentName: 'takabondhu-voice',
    numIdleProcesses: 0
  }));
}
