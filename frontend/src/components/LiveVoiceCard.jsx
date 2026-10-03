import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  AlertCircle, 
  Radio, 
  HelpCircle,
  Send,
  Zap,
  PhoneCall,
  PhoneOff,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { Room, RoomEvent } from 'livekit-client';
import { apiUrl } from '../apiConfig';

export default function LiveVoiceCard({ lang = 'bn', onScrollToAnalyzer }) {
  // Voice mode: 'browser' (default) | 'realtime'
  const [voiceMode, setVoiceMode] = useState('browser');
  const [voiceStatus, setVoiceStatus] = useState({ browserVoice: true, realtime: false });

  // Call Lifecycle: In-call state & sub-state ('idle' | 'listening' | 'thinking' | 'speaking')
  const [isCallActive, setIsCallActive] = useState(false);
  const [agentState, setAgentState] = useState('idle');
  const [isMuted, setIsMuted] = useState(false);

  const [noticeMessage, setNoticeMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [networkError, setNetworkError] = useState(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);

  // Transcripts & Analysis
  const [userTranscript, setUserTranscript] = useState('');
  const [aiReply, setAiReply] = useState(
    lang === 'bn' 
      ? 'আসসালামু আলাইকুম! কীভাবে সাহায্য করতে পারি?'
      : 'Hello! How can I help you today?'
  );
  const [detectedSignals, setDetectedSignals] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [textInput, setTextInput] = useState('');

  // Refs to prevent closure staleness across continuous speech events
  const isCallActiveRef = useRef(false);
  const agentStateRef = useRef('idle');
  const isMutedRef = useRef(false);
  const conversationHistoryRef = useRef([]);
  const recognitionRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const roomRef = useRef(null);
  const speakingWatchdogRef = useRef(null);
  const latestTranscriptRef = useRef('');
  const activeAudioRef = useRef(null);
  const activeUtteranceRef = useRef(null);

  // Function ref bridges to eliminate circular dependencies
  const startListeningRef = useRef(null);
  const speakTextRef = useRef(null);
  const handleUserSpeechTurnRef = useRef(null);

  const isSpeechSupported = typeof window !== 'undefined' && 
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  // Web Audio chime helper for subtle audible feedback
  const playFeedbackChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch {
      // AudioContext unavailable or restricted
    }
  }, []);

  // Keep state refs in sync
  useEffect(() => {
    isCallActiveRef.current = isCallActive;
  }, [isCallActive]);

  useEffect(() => {
    agentStateRef.current = agentState;
  }, [agentState]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    conversationHistoryRef.current = conversationHistory;
  }, [conversationHistory]);

  // 1. Fetch Voice Status on mount
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch(apiUrl('/api/voice/status'));
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            setVoiceStatus(data);
          }
        }
      } catch {
        setVoiceStatus({ browserVoice: true, realtime: false });
      }
    }
    checkStatus();

    return () => {
      stopEverything();
    };
  }, []);

  // Stop everything and reset all audio/mic streams
  const stopEverything = useCallback(() => {
    isCallActiveRef.current = false;
    setIsCallActive(false);

    if (speakingWatchdogRef.current) {
      clearTimeout(speakingWatchdogRef.current);
      speakingWatchdogRef.current = null;
    }

    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch {}
      activeAudioRef.current = null;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch {}
    }
    activeUtteranceRef.current = null;
    if (roomRef.current) {
      try { roomRef.current.disconnect(); } catch { /* ignore */ }
      roomRef.current = null;
    }
    setAgentState('idle');
  }, []);

  // 2. Speech Synthesis Fallback (Client Web Speech API)
  const fallbackSpeechSynthesis = useCallback((text, onFinish) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setAgentState('idle');
      onFinish?.();
      if (isCallActiveRef.current && !isMutedRef.current) {
        startListeningRef.current?.();
      }
      return;
    }

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      const voices = window.speechSynthesis.getVoices() || [];
      const bnVoice = voices.find(v => v.lang?.startsWith('bn')) ||
                      voices.find(v => v.lang?.includes('Bengali') || v.lang?.includes('Bangla'));

      // If text is in Bengali and OS lacks a Bengali TTS voice:
      // Passing Bengali unicode to an English voice results in total silence or crashes.
      // In this scenario, play the audible feedback chime and advance after a natural reading delay.
      if (!bnVoice && lang === 'bn') {
        playFeedbackChime();
        setAgentState('speaking');
        const simulatedDuration = Math.min(3500, Math.max(1200, text.length * 45));
        setTimeout(() => {
          setAgentState('idle');
          onFinish?.();
          if (isCallActiveRef.current && !isMutedRef.current) {
            startListeningRef.current?.();
          }
        }, simulatedDuration);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      activeUtteranceRef.current = utterance;
      if (typeof window !== 'undefined') {
        window.__takabondhu_utterance = utterance; // Prevent V8 garbage collector premature cutoff
      }

      if (bnVoice) {
        utterance.voice = bnVoice;
        utterance.lang = bnVoice.lang;
      } else {
        utterance.lang = 'en-US';
      }
      utterance.rate = 0.95;

      utterance.onstart = () => {
        setAgentState('speaking');
      };

      utterance.onend = () => {
        setAgentState('idle');
        activeUtteranceRef.current = null;
        onFinish?.();
        if (isCallActiveRef.current && !isMutedRef.current) {
          startListeningRef.current?.();
        }
      };

      utterance.onerror = (err) => {
        console.warn('SpeechSynthesis notice:', err);
        setAgentState('idle');
        activeUtteranceRef.current = null;
        onFinish?.();
        if (isCallActiveRef.current && !isMutedRef.current) {
          startListeningRef.current?.();
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      setAgentState('idle');
      onFinish?.();
      if (isCallActiveRef.current && !isMutedRef.current) {
        startListeningRef.current?.();
      }
    }
  }, [lang, playFeedbackChime]);

  // 3. Spoken Audio Engine (Primary: High-Fidelity /api/voice/tts MP3 audio; Secondary: SpeechSynthesis)
  const speakText = useCallback((text, onFinish) => {
    if (!text || !text.trim()) {
      onFinish?.();
      return;
    }

    const clean = text.trim();

    // Stop any previous playing audio or speech
    if (speakingWatchdogRef.current) {
      clearTimeout(speakingWatchdogRef.current);
      speakingWatchdogRef.current = null;
    }
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch {}
      activeAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch {}
    }

    setAgentState('speaking');

    // Watchdog timer: ensure agent NEVER stays stuck in 'speaking' mode
    const watchdogLimitMs = Math.min(8000, Math.max(3000, clean.length * 80));
    speakingWatchdogRef.current = setTimeout(() => {
      if (agentStateRef.current === 'speaking') {
        console.warn('Voice playback watchdog triggered auto-transition to listening');
        setAgentState('idle');
        if (activeAudioRef.current) {
          try { activeAudioRef.current.pause(); } catch {}
          activeAudioRef.current = null;
        }
        onFinish?.();
        if (isCallActiveRef.current && !isMutedRef.current) {
          startListeningRef.current?.();
        }
      }
    }, watchdogLimitMs);

    // 1. Primary: Stream high-fidelity MP3 from backend /api/voice/tts
    try {
      const ttsUrl = apiUrl(`/api/voice/tts?text=${encodeURIComponent(clean.slice(0, 200))}&lang=${lang}`);
      const audio = new Audio();
      audio.src = ttsUrl;
      audio.playbackRate = 1.05;
      activeAudioRef.current = audio;

      audio.onended = () => {
        if (speakingWatchdogRef.current) {
          clearTimeout(speakingWatchdogRef.current);
          speakingWatchdogRef.current = null;
        }
        setAgentState('idle');
        activeAudioRef.current = null;
        onFinish?.();
        if (isCallActiveRef.current && !isMutedRef.current) {
          startListeningRef.current?.();
        }
      };

      audio.onerror = () => {
        console.warn('TTS streaming endpoint note, using browser speech synthesis fallback');
        activeAudioRef.current = null;
        fallbackSpeechSynthesis(clean, onFinish);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((playErr) => {
          console.warn('Audio play restricted or aborted, falling back:', playErr);
          activeAudioRef.current = null;
          fallbackSpeechSynthesis(clean, onFinish);
        });
      }
    } catch (e) {
      console.warn('Audio element error, falling back:', e);
      fallbackSpeechSynthesis(clean, onFinish);
    }
  }, [lang, fallbackSpeechSynthesis]);

  speakTextRef.current = speakText;

  // 4. Process User Speech via Backend /api/voice/chat
  const handleUserSpeechTurn = useCallback(async (text) => {
    if (!text || !text.trim()) return;
    const cleanText = text.trim();
    setUserTranscript(cleanText);
    latestTranscriptRef.current = '';
    setPendingConfirmation(null);
    setNetworkError(null);

    // Pause recognition while assistant is thinking and speaking
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }

    setAgentState('thinking');
    setErrorMessage(null);

    try {
      const historyPayload = conversationHistoryRef.current.slice(-4);
      const res = await fetch(apiUrl('/api/voice/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: cleanText, 
          lang,
          history: historyPayload
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}: Voice chat request failed`);
      const data = await res.json();

      setAnalysisResult(data);
      if (Array.isArray(data.signals) && data.signals.length > 0) {
        setDetectedSignals(data.signals);
      } else {
        setDetectedSignals([]);
      }

      const reply = data.reply || (lang === 'bn' ? 'কী মেসেজ এসেছে বা কেউ কী বলেছে, সেটা বলুন।' : 'Please describe the message or call you received.');
      setAiReply(reply);

      // Update conversation history (last 4 turns)
      setConversationHistory(prev => [
        ...prev.slice(-3),
        { role: 'user', text: cleanText },
        { role: 'assistant', text: reply }
      ]);

      speakTextRef.current?.(reply);
    } catch (err) {
      console.warn('Voice chat turn error:', err);
      // NEVER fall back to generic canned sentence on network error!
      setAgentState('idle');
      setNetworkError({
        failedText: cleanText,
        error: err.message || 'Network request failed'
      });
      setAiReply(
        lang === 'bn'
          ? 'সংযোগ বিচ্ছিন্ন বা সার্ভার ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন বা নিচে লিখে পাঠান।'
          : 'Connection error occurred. Please retry or type your inquiry below.'
      );
      // Do NOT invoke speakText with canned message
    }
  }, [lang]);

  handleUserSpeechTurnRef.current = handleUserSpeechTurn;

  // 5. Start Listening (Continuous Microphone Recognition)
  const startListening = useCallback(() => {
    if (!isSpeechSupported) {
      setNoticeMessage(
        lang === 'bn'
          ? 'আপনার ব্রাউজারে স্পিচ রিকগনিশন সমর্থন নেই। নিচে বক্সে লিখে যাচাই করুন।'
          : 'Speech recognition is not supported in this browser. Please type below.'
      );
      return;
    }

    if (isMutedRef.current) return;

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      recognitionRef.current = rec;

      rec.lang = lang === 'bn' ? 'bn-BD' : 'en-US';
      rec.continuous = true;
      rec.interimResults = true;

      rec.onstart = () => {
        setAgentState('listening');
      };

      rec.onresult = (e) => {
        let currentTranscript = '';
        let minConfidence = 1.0;
        for (let i = 0; i < e.results.length; i++) {
          currentTranscript += e.results[i][0].transcript;
          const conf = e.results[i][0].confidence;
          if (typeof conf === 'number' && conf > 0 && conf < minConfidence) {
            minConfidence = conf;
          }
        }
        const trimmed = currentTranscript.trim();
        if (trimmed) {
          setUserTranscript(trimmed);
          latestTranscriptRef.current = trimmed;
          setAgentState('listening');

          // Debounce turn completion: trigger assistant reply 750ms after user pauses speaking
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          debounceTimerRef.current = setTimeout(() => {
            if (latestTranscriptRef.current && isCallActiveRef.current) {
              const candidate = latestTranscriptRef.current;
              // If recognized text is very short (< 4 chars) or confidence is low (< 0.45)
              const isVeryShort = candidate.length < 4 || (candidate.split(/\s+/).filter(Boolean).length === 1 && candidate.length < 5);
              const isLowConfidence = minConfidence > 0 && minConfidence < 0.45;

              if (isVeryShort || isLowConfidence) {
                setPendingConfirmation({
                  text: candidate,
                  reason: isVeryShort ? 'short' : 'low_confidence'
                });
                setAgentState('idle');
              } else {
                setPendingConfirmation(null);
                handleUserSpeechTurnRef.current?.(candidate);
              }
            }
          }, 750);
        }
      };

      rec.onerror = (e) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          setErrorMessage(
            lang === 'bn'
              ? 'মাইক্রোফোন ব্যবহারের অনুমতি দিন।'
              : 'Please allow microphone access in browser settings.'
          );
          setAgentState('idle');
        } else if (e.error === 'no-speech') {
          // Normal silence, don't show error
        } else if (e.error === 'network') {
          console.warn('Speech recognition network blip, scheduled retry');
          setTimeout(() => {
            if (isCallActiveRef.current && !isMutedRef.current && agentStateRef.current !== 'speaking' && agentStateRef.current !== 'thinking') {
              try { rec.start(); } catch {}
            }
          }, 600);
        } else {
          console.warn('Speech recognition notice:', e.error);
        }
      };

      rec.onend = () => {
        // If call is still active and AI isn't speaking or thinking, keep listening alive with a safe delay
        if (isCallActiveRef.current && !isMutedRef.current && agentStateRef.current !== 'speaking' && agentStateRef.current !== 'thinking') {
          setTimeout(() => {
            if (isCallActiveRef.current && !isMutedRef.current && agentStateRef.current !== 'speaking' && agentStateRef.current !== 'thinking') {
              try { rec.start(); } catch {}
            }
          }, 200);
        }
      };

      rec.start();
    } catch (err) {
      console.warn('Could not start recognition:', err);
    }
  }, [isSpeechSupported, lang]);

  startListeningRef.current = startListening;

  // 6. Start Call (Live Interactive Voice Call Mode)
  const handleStartCall = () => {
    setErrorMessage(null);
    setNoticeMessage(null);
    setUserTranscript('');
    setDetectedSignals([]);

    setIsCallActive(true);
    isCallActiveRef.current = true;
    setIsMuted(false);
    isMutedRef.current = false;

    // Prompt/prime microphone access immediately within user gesture to satisfy browser security
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          stream.getTracks().forEach(t => t.stop());
        })
        .catch(err => {
          console.warn('Microphone permission request:', err.message);
        });
    }

    const openingGreeting = lang === 'bn'
      ? 'আসসালামু আলাইকুম! কীভাবে সাহায্য করতে পারি?'
      : 'Hello! How can I help you today?';

    setAiReply(openingGreeting);

    // Speak initial greeting aloud; when done, microphone automatically listens!
    speakText(openingGreeting);
  };

  // 7. End Call
  const handleEndCall = () => {
    stopEverything();
    const endingNotice = lang === 'bn'
      ? 'কল সম্পন্ন হয়েছে। নতুন কোনো সন্দেহজনক মেসেজ নিয়ে কথা বলতে চাইলে আবার কল শুরু করুন।'
      : 'Call ended. Start a call whenever you wish to verify any message or financial situation.';
    setAiReply(endingNotice);
  };

  // 8. Toggle Mute
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    isMutedRef.current = nextMuted;

    if (nextMuted) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setAgentState('idle');
    } else {
      if (isCallActiveRef.current && agentStateRef.current !== 'speaking' && agentStateRef.current !== 'thinking') {
        startListening();
      }
    }
  };

  // 9. 1-Click Quick Scenario Test
  const handleQuickScenario = (text) => {
    setUserTranscript(text);
    if (!isCallActive) {
      setIsCallActive(true);
      isCallActiveRef.current = true;
      setIsMuted(false);
      isMutedRef.current = false;
    }
    handleUserSpeechTurn(text);
  };

  return (
    <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-5 sm:p-6 shadow-xl space-y-5">
      {/* Top Banner: Mode Indicator & Call Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            isCallActive 
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <Radio className={`w-3.5 h-3.5 ${isCallActive ? 'animate-pulse text-emerald-400' : 'text-slate-500'}`} />
            {isCallActive
              ? (lang === 'bn' ? 'ভয়েস কল চলছে (Active Call)' : 'Voice Call Active')
              : (lang === 'bn' ? 'ভয়েস সহকারী (Voice Assistant)' : 'Voice Assistant Ready')}
          </span>

          <span className="text-xs text-slate-400">
            {isCallActive 
              ? (lang === 'bn' ? 'দ্বিমুখী লাইভ কথোপকথন' : 'Two-way live audio call')
              : (lang === 'bn' ? 'সরাসরি কথা বলুন' : 'Speak freely')}
          </span>
        </div>

        {/* Realtime worker badge indicator */}
        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${voiceStatus.realtime ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400'}`}></span>
          <span>{voiceStatus.realtime ? 'LiveKit Cloud + Gemini' : 'Autonomous Voice AI Engine'}</span>
        </div>
      </div>

      {/* Notice Message */}
      {noticeMessage && (
        <div className="rounded-lg bg-cyan-950/50 border border-cyan-500/30 p-3 text-xs text-cyan-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{noticeMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="rounded-lg bg-rose-950/50 border border-rose-500/30 p-3 text-xs text-rose-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Central Visual Interaction Area: Active Call Sphere */}
      <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
        {/* Pulsing Visualizer / Call State Indicator */}
        <div className="relative flex items-center justify-center">
          {/* Animated concentric rings during call */}
          {isCallActive && agentState === 'listening' && (
            <div className="absolute w-28 h-28 rounded-full border-2 border-emerald-400/40 animate-ping"></div>
          )}
          {isCallActive && agentState === 'speaking' && (
            <div className="absolute w-28 h-28 rounded-full border-2 border-cyan-400/40 animate-ping"></div>
          )}
          {isCallActive && agentState === 'thinking' && (
            <div className="absolute w-28 h-28 rounded-full border-2 border-indigo-400/40 animate-pulse"></div>
          )}

          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all transform ${
              !isCallActive
                ? 'bg-slate-800 text-slate-400 border border-slate-700'
                : isMuted
                ? 'bg-amber-600 text-white ring-4 ring-amber-500/30'
                : agentState === 'speaking'
                ? 'bg-cyan-500 text-white ring-8 ring-cyan-500/20 shadow-cyan-500/30'
                : agentState === 'thinking'
                ? 'bg-indigo-600 text-white ring-8 ring-indigo-500/20'
                : 'bg-emerald-600 text-white ring-8 ring-emerald-500/20 shadow-emerald-500/30'
            }`}
          >
            {!isCallActive ? (
              <PhoneCall className="w-8 h-8 text-emerald-400" />
            ) : isMuted ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : agentState === 'speaking' ? (
              <Volume2 className="w-8 h-8 animate-bounce" />
            ) : agentState === 'thinking' ? (
              <RefreshCw className="w-8 h-8 animate-spin" />
            ) : (
              <Mic className="w-8 h-8 animate-pulse" />
            )}
          </div>
        </div>

        <div>
          <div className="text-base font-semibold text-white">
            {!isCallActive
              ? (lang === 'bn' ? 'ভয়েস কল শুরু করতে নিচে চাপুন' : 'Click below to start voice call')
              : isMuted
              ? (lang === 'bn' ? 'মাইক্রোফোন মিউট করা আছে' : 'Microphone is muted')
              : agentState === 'listening'
              ? (lang === 'bn' ? 'শুনছি... স্বাভাবিকভাবে কথা বলুন' : 'Listening... Speak naturally')
              : agentState === 'thinking'
              ? (lang === 'bn' ? 'যাচাই ও বিশ্লেষণ করা হচ্ছে...' : 'Analyzing financial safety...')
              : (lang === 'bn' ? 'সহকারী কথা বলছে...' : 'Assistant is speaking...')}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {!isCallActive 
              ? (lang === 'bn' ? 'কল চালু থাকলে বারবার ক্লিক করার প্রয়োজন নেই, স্বাভাবিকভাবে কথা বলা যায়' : 'Continuous call — no need to click on every turn')
              : (lang === 'bn' ? 'আপনার কথা শেষ হলে স্বয়ংক্রিয়ভাবে উত্তর দেবে এবং পুনরায় শুনবে' : 'Automatically replies and listens back and forth')}
          </p>
        </div>

        {/* Primary Call Controls */}
        <div className="flex items-center justify-center gap-3 pt-2">
          {!isCallActive ? (
            <button
              onClick={handleStartCall}
              className="px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 transition-all active:scale-95 flex items-center space-x-2"
            >
              <PhoneCall className="w-4 h-4" />
              <span>{lang === 'bn' ? 'কল শুরু করুন' : 'Start Live Voice'}</span>
            </button>
          ) : (
            <>
              <button
                onClick={toggleMute}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-2 ${
                  isMuted 
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' 
                    : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750'
                }`}
              >
                {isMuted ? <MicOff className="w-4 h-4 text-amber-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
                <span>{isMuted ? (lang === 'bn' ? 'আনমিউট' : 'Unmute') : (lang === 'bn' ? 'মিউট' : 'Mute')}</span>
              </button>

              <button
                onClick={handleEndCall}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all active:scale-95 flex items-center space-x-2"
              >
                <PhoneOff className="w-4 h-4" />
                <span>{lang === 'bn' ? 'কল শেষ করুন' : 'End Voice Call'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 1-Click Quick Scenario Chips for Instant Demonstration */}
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg mx-auto pt-1">
        <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center">
          <Zap className="w-3 h-3 text-cyan-400 mr-1" />
          {lang === 'bn' ? 'দ্রুত পরীক্ষা করুন:' : 'Quick Voice Test:'}
        </span>
        <button
          type="button"
          onClick={() => handleQuickScenario('আমার বিকাশ অ্যাকাউন্ট বন্ধ হয়ে যাবে বলে ৫০০০ টাকা পাঠাতে বলছে।')}
          className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs transition-all active:scale-95"
        >
          🔴 বিকাশ বন্ধের হুমকি
        </button>
        <button
          type="button"
          onClick={() => handleQuickScenario('আপনাকে লটারির ২৫ লাখ টাকা দেওয়ার জন্য ওটিপি কোড চাওয়া হচ্ছে।')}
          className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs transition-all active:scale-95"
        >
          🟠 লটারি ও ওটিপি দাবি
        </button>
        <button
          type="button"
          onClick={() => handleQuickScenario('সালাম, আপনি কেমন আছেন? টাকাবন্ধু কীভাবে কাজ করে?')}
          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs transition-all active:scale-95"
        >
          🟢 সাধারণ কুশল বিনিময়
        </button>
      </div>

      {/* Network Error with Retry & Text Input Option */}
      {networkError && (
        <div className="rounded-xl bg-rose-950/70 border border-rose-500/50 p-4 space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              {lang === 'bn' 
                ? 'সংযোগ সমস্যা: সার্ভারে পৌঁছানো সম্ভব হয়নি' 
                : 'Connection issue: Could not reach voice service'}
            </span>
          </div>
          <p className="text-xs text-rose-200/90 leading-relaxed">
            {lang === 'bn'
              ? 'সার্ভারে সাময়িক সংযোগ ত্রুটি হয়েছে। আপনি সরাসরি পুনরায় চেষ্টা করতে পারেন অথবা টেক্সট বক্সে প্রশ্নটি পাঠিয়ে নিশ্চিত হতে পারেন।'
              : 'A temporary network error occurred. You can retry directly or send your inquiry via text.'}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                const retryText = networkError.failedText;
                setNetworkError(null);
                handleUserSpeechTurn(retryText);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-rose-900/30 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTextInput(networkError.failedText);
                setNetworkError(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-medium transition-all"
            >
              <span>{lang === 'bn' ? 'টেক্সট বক্সে এডিট করুন' : 'Edit as text'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Spoken Word Confirmation (For very short or low confidence speech) */}
      {pendingConfirmation && (
        <div className="rounded-xl bg-amber-950/70 border border-amber-500/50 p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between text-amber-300 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {lang === 'bn' 
                  ? 'আমরা কি সঠিক কথা শুনতে পেয়েছি?' 
                  : 'Did we capture your speech accurately?'}
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30">
              {pendingConfirmation.reason === 'short'
                ? (lang === 'bn' ? 'ছোট বাক্য' : 'Short utterance')
                : (lang === 'bn' ? 'স্বল্প স্পষ্টতা' : 'Low confidence')}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/90 border border-amber-500/30 text-white font-medium text-sm">
            "{pendingConfirmation.text}"
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const confText = pendingConfirmation.text;
                setPendingConfirmation(null);
                handleUserSpeechTurn(confText);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-900/30 active:scale-95"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'হ্যাঁ, ঠিক আছে (যাচাই করুন)' : 'Yes, Confirm & Check'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPendingConfirmation(null);
                setUserTranscript('');
                startListening();
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-medium transition-all"
            >
              <span>{lang === 'bn' ? 'আবার বলুন' : 'Speak again'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTextInput(pendingConfirmation.text);
                setPendingConfirmation(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 text-xs font-medium transition-all"
            >
              <span>{lang === 'bn' ? 'লিখে ঠিক করুন' : 'Edit text'}</span>
            </button>
          </div>
        </div>
      )}

      {/* User Speech Display */}
      {userTranscript && (
        <div className="rounded-xl bg-slate-800/80 border border-slate-700/60 p-3.5 text-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-semibold">
              <Mic className="w-3.5 h-3.5 text-cyan-400" />
              {lang === 'bn' ? 'আপনার কথা (Microphone):' : 'You said:'}
            </span>
            {agentState === 'listening' && (
              <span className="text-emerald-400 text-[10px] animate-pulse">● শুনছি...</span>
            )}
          </div>
          <p className="text-white font-medium leading-relaxed">"{userTranscript}"</p>

          {/* Realtime Threat Signals Badges */}
          {detectedSignals.length > 0 && (
            <div className="pt-2 flex flex-wrap gap-1.5 border-t border-slate-700/50">
              {detectedSignals.map((sig, idx) => (
                <span 
                  key={idx}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center space-x-1"
                >
                  <ShieldAlert className="w-3 h-3 text-rose-400" />
                  <span>{sig.type || sig.name}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Reply Display (Prominent Conversational Bubble) */}
      <div className="rounded-xl bg-slate-950/70 border border-emerald-500/30 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            {lang === 'bn' ? 'TakaBondhu ভয়েস সহকারী:' : 'TakaBondhu Response:'}
          </span>

          {aiReply && (
            <button
              onClick={() => speakText(aiReply)}
              className="flex items-center gap-1 text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              title={lang === 'bn' ? 'আবার শুনুন' : 'Listen again'}
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'bn' ? 'শুনুন' : 'Listen'}</span>
            </button>
          )}
        </div>

        <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed">
          {aiReply}
        </p>

        {analysisResult && onScrollToAnalyzer && (
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'bn' ? 'রুল ইঞ্জিন ও সেফটি নলেজবেস সংযুক্ত' : 'Grounded in safety rules'}</span>
            </span>
            <button
              onClick={onScrollToAnalyzer}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors"
            >
              <span>{lang === 'bn' ? 'পূর্ণাঙ্গ বিশ্লেষণ দেখুন' : 'View safety breakdown'}</span>
              <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
        )}
      </div>

      {/* Text Input Fallback (for typing preference or unsupported browsers) */}
      <div className="pt-2 border-t border-slate-800">
        <div className="text-xs text-slate-400 mb-2 flex items-center justify-between">
          <span>{lang === 'bn' ? 'অথবা লিখে কথা বলুন / যাচাই করুন:' : 'Or type your question:'}</span>
          {!isSpeechSupported && (
            <span className="text-[11px] text-amber-400 font-medium">
              {lang === 'bn' ? '(ব্রাউজারে টাইপিং মোড সক্রিয়)' : '(Typing fallback active)'}
            </span>
          )}
        </div>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (textInput.trim()) {
              handleUserSpeechTurn(textInput);
              setTextInput('');
            }
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={lang === 'bn' ? 'যেমন: কোনো মেসেজ এসেছে বা সন্দেহ হলে এখানে লিখুন...' : 'e.g. Received suspicious message or inquiry...'}
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!textInput.trim() || agentState === 'thinking'}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors shrink-0"
          >
            <span>{lang === 'bn' ? 'পাঠান' : 'Send'}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
