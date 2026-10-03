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
  PhoneOff,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { Room, RoomEvent } from 'livekit-client';
import { apiUrl } from '../apiConfig';

export default function LiveVoiceCard({ lang = 'bn', onScrollToAnalyzer }) {
  // Voice mode: 'browser' (default) | 'realtime'
  const [voiceMode, setVoiceMode] = useState('browser');
  const [voiceStatus, setVoiceStatus] = useState({ browserVoice: true, realtime: false });
  const [connectionState, setConnectionState] = useState('idle'); // 'idle' | 'listening' | 'thinking' | 'speaking'
  const [noticeMessage, setNoticeMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Transcripts & Replies
  const [userTranscript, setUserTranscript] = useState('');
  const [aiReply, setAiReply] = useState(
    lang === 'bn' 
      ? 'আসসালামু আলাইকুম! কোনো মেসেজ বা সন্দেহজনক ফোন কল নিয়ে জানতে মাইক্রোফোনে কথা বলুন বা লিখে পাঠান।'
      : 'Hello! Speak into your microphone or type a message to check if it is safe.'
  );
  const [analysisResult, setAnalysisResult] = useState(null);
  const [textInput, setTextInput] = useState('');

  // Audio & SpeechRecognition refs
  const recognitionRef = useRef(null);
  const speechSynthesisUtteranceRef = useRef(null);
  const roomRef = useRef(null);
  const agentTimeoutRef = useRef(null);
  const isSpeechSupported = typeof window !== 'undefined' && 
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  // 1. Fetch Voice Status on mount
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch(apiUrl('/api/voice/status'));
        if (res.ok) {
          const data = await res.json();
          setVoiceStatus(data);
        }
      } catch {
        // Fallback default
        setVoiceStatus({ browserVoice: true, realtime: false });
      }
    }
    checkStatus();

    return () => {
      stopEverything();
    };
  }, []);

  const stopEverything = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (agentTimeoutRef.current) {
      clearTimeout(agentTimeoutRef.current);
      agentTimeoutRef.current = null;
    }
    if (roomRef.current) {
      try { roomRef.current.disconnect(); } catch { /* ignore */ }
      roomRef.current = null;
    }
    setConnectionState('idle');
  }, []);

  // 2. Browser Voice Synthesis (TTS)
  const speakText = useCallback((text) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesisUtteranceRef.current = utterance;

      const voices = window.speechSynthesis.getVoices();
      const bnVoice = voices.find(v => v.lang.startsWith('bn')) ||
                      voices.find(v => v.lang.includes('Bengali') || v.lang.includes('Bangla'));
      if (bnVoice) {
        utterance.voice = bnVoice;
        utterance.lang = bnVoice.lang;
      } else {
        utterance.lang = lang === 'bn' ? 'bn-BD' : 'en-US';
      }
      utterance.rate = 0.95;

      utterance.onstart = () => setConnectionState('speaking');
      utterance.onend = () => setConnectionState('idle');
      utterance.onerror = () => setConnectionState('idle');

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      setConnectionState('idle');
    }
  }, [lang]);

  // 3. Process Text with Backend /api/analyze
  const handleAnalyzeText = async (text) => {
    if (!text || !text.trim()) return;
    const cleanText = text.trim();
    setUserTranscript(cleanText);
    setConnectionState('thinking');
    setErrorMessage(null);

    try {
      const res = await fetch(apiUrl('/api/analyze'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: cleanText })
      });

      if (!res.ok) throw new Error('Analysis request failed');
      const data = await res.json();
      setAnalysisResult(data);

      // Generate conversational, friendly reply in plain language
      let replyMessage = '';
      const score = data.riskScore ?? 0;
      const isRisky = score >= 50;

      if (lang === 'bn') {
        if (isRisky) {
          replyMessage = `সাবধান! এটি ঝুঁকিপূর্ণ মনে হচ্ছে (স্কোর ${score}/১০০)। টাকা পাঠাবেন না বা পিন কোড দেবেন না। উপায় অ্যাপ বা হেল্পলাইনে ১৬২৬৮ নম্বরে যোগাযোগ করুন।`;
        } else if (score >= 30) {
          replyMessage = `সতর্ক থাকুন! কিছু তথ্য অস্পষ্ট (স্কোর ${score}/১০০)। নিশ্চিত না হয়ে কোনো পদক্ষেপ নেবেন না।`;
        } else {
          replyMessage = `এটি নিরাপদ দেখাচ্ছে (স্কোর ${score}/১০০)। তবে কখনো কাউকে আপনার গোপন পিন বা ওটিপি দেবেন না।`;
        }
      } else {
        if (isRisky) {
          replyMessage = `Be careful! This appears risky (score ${score}/100). Do not send money or share PIN. Contact upay at 16268.`;
        } else if (score >= 30) {
          replyMessage = `Please be cautious (score ${score}/100). Verify before making any transactions.`;
        } else {
          replyMessage = `This looks safe (score ${score}/100). Remember never to share your secret PIN or OTP.`;
        }
      }

      setAiReply(replyMessage);
      speakText(replyMessage);
    } catch (err) {
      console.warn('Analysis error:', err);
      const fallbackReply = lang === 'bn' 
        ? 'দুঃখিত, সংযোগে সমস্যা হয়েছে। অনুগ্রহ করে মেসেজটি টাইপ করে আবার চেক করুন।'
        : 'Connection issue. Please type the message to check.';
      setAiReply(fallbackReply);
      setConnectionState('idle');
    }
  };

  // 4. Browser Voice Recognition (STT)
  const startBrowserVoice = () => {
    if (!isSpeechSupported) {
      setNoticeMessage(
        lang === 'bn'
          ? 'আপনার ব্রাউজারে স্পিচ রিকগনিশন সমর্থন নেই। নিচে বক্সে টাইপ করুন।'
          : 'Speech recognition is not supported in this browser. Please type below.'
      );
      return;
    }

    try {
      window.speechSynthesis?.cancel();
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      recognitionRef.current = rec;

      rec.lang = lang === 'bn' ? 'bn-BD' : 'en-US';
      rec.continuous = false;
      rec.interimResults = true;

      rec.onstart = () => {
        setConnectionState('listening');
        setUserTranscript('');
      };

      rec.onresult = (e) => {
        let currentTranscript = '';
        for (let i = 0; i < e.results.length; i++) {
          currentTranscript += e.results[i][0].transcript;
        }
        setUserTranscript(currentTranscript);
      };

      rec.onerror = (e) => {
        console.warn('Speech recognition error:', e.error);
        setConnectionState('idle');
        if (e.error === 'not-allowed') {
          setErrorMessage(
            lang === 'bn' 
              ? 'মাইক্রোফোন ব্যবহারের অনুমতি দিন।' 
              : 'Please allow microphone access.'
          );
        }
      };

      rec.onend = () => {
        setConnectionState('idle');
        if (userTranscript) {
          handleAnalyzeText(userTranscript);
        }
      };

      rec.start();
    } catch (err) {
      console.warn('Could not start recognition:', err);
      setConnectionState('idle');
    }
  };

  // 5. Start Optional LiveKit Realtime with 8s Auto-Fallback
  const handleStartRealtime = async () => {
    stopEverything();
    setNoticeMessage(null);
    setErrorMessage(null);
    setConnectionState('listening');

    try {
      const roomName = `takabondhu-${Date.now().toString(36)}`;
      const res = await fetch(apiUrl('/api/livekit/token'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName })
      });

      if (!res.ok) {
        // Fallback on 503 or error
        setVoiceMode('browser');
        setNoticeMessage(
          lang === 'bn'
            ? 'রিয়েলটাইম সার্ভার অনুপলব্ধ, ব্রাউজার ভয়েস মোড চালু করা হয়েছে।'
            : 'Realtime server not available, switched to browser voice.'
        );
        startBrowserVoice();
        return;
      }

      const tokenData = await res.json();
      if (!tokenData.token) {
        throw new Error('No token received');
      }

      const room = new Room({
        adaptiveStream: true,
        dynacast: true
      });
      roomRef.current = room;

      room.on(RoomEvent.Connected, () => {
        // Wait max 8 seconds for agent participant
        agentTimeoutRef.current = setTimeout(() => {
          const hasAgent = room.remoteParticipants.size > 0;
          if (!hasAgent) {
            console.warn('[VOICE] No agent joined within 8s, falling back to browser voice');
            room.disconnect();
            setVoiceMode('browser');
            setNoticeMessage(
              lang === 'bn'
                ? 'ভয়েস এজেন্ট সংযুক্ত হয়নি, ব্রাউজার ভয়েসে কথা বলুন।'
                : 'Realtime agent did not join, using browser voice.'
            );
            startBrowserVoice();
          }
        }, 8000);
      });

      room.on(RoomEvent.ParticipantConnected, () => {
        if (agentTimeoutRef.current) {
          clearTimeout(agentTimeoutRef.current);
          agentTimeoutRef.current = null;
        }
      });

      room.on(RoomEvent.Disconnected, () => {
        setConnectionState('idle');
      });

      await room.connect(tokenData.livekitUrl, tokenData.token);
    } catch (err) {
      console.warn('Realtime connection error, falling back:', err.message);
      setVoiceMode('browser');
      setNoticeMessage(
        lang === 'bn'
          ? 'রিয়েলটাইম সার্ভার সংযুক্ত হয়নি, ব্রাউজার ভয়েস চালু করা হয়েছে।'
          : 'Could not connect to realtime server, switched to browser voice.'
      );
      startBrowserVoice();
    }
  };

  return (
    <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-5 sm:p-6 shadow-xl space-y-5">
      {/* Top Banner: Mode Indicator & Notice */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            {voiceMode === 'browser' 
              ? (lang === 'bn' ? 'ব্রাউজার ভয়েস' : 'Browser Voice') 
              : (lang === 'bn' ? 'লাইভকিট রিয়েলটাইম' : 'LiveKit Realtime')}
          </span>

          <span className="text-xs text-slate-400">
            {voiceMode === 'browser' 
              ? (lang === 'bn' ? '(স্বয়ংক্রিয় অফলাইন ও দ্রুত)' : '(Fast & built-in)')
              : (lang === 'bn' ? '(ওয়েবআরটিসি)' : '(WebRTC)')}
          </span>
        </div>

        {/* Optional Realtime Toggle (Only when realtime is verified available) */}
        {voiceStatus.realtime && (
          <button
            onClick={() => {
              if (voiceMode === 'browser') {
                setVoiceMode('realtime');
                handleStartRealtime();
              } else {
                setVoiceMode('browser');
                stopEverything();
              }
            }}
            className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-950/40 px-3 py-1.5 rounded-lg border border-cyan-500/30 transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            {voiceMode === 'browser'
              ? (lang === 'bn' ? 'লাইভকিট রিয়েলটাইমে যান' : 'Switch to Realtime AI')
              : (lang === 'bn' ? 'ব্রাউজার ভয়েসে ফিরুন' : 'Back to Browser Voice')}
          </button>
        )}
      </div>

      {/* Notice Message if Fallback Occurred */}
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

      {/* Central Visual Interaction Area */}
      <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
        {/* Pulsing Mic / Action Button */}
        <button
          onClick={() => {
            if (connectionState === 'listening') {
              stopEverything();
            } else if (voiceMode === 'realtime') {
              handleStartRealtime();
            } else {
              startBrowserVoice();
            }
          }}
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all transform active:scale-95 ${
            connectionState === 'listening'
              ? 'bg-rose-500 hover:bg-rose-600 text-white ring-8 ring-rose-500/20 animate-pulse'
              : connectionState === 'speaking'
              ? 'bg-cyan-500 text-white ring-8 ring-cyan-500/20'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white ring-4 ring-emerald-500/20'
          }`}
          aria-label={connectionState === 'listening' ? 'Stop listening' : 'Start speaking'}
        >
          {connectionState === 'listening' ? (
            <MicOff className="w-8 h-8" />
          ) : connectionState === 'speaking' ? (
            <Volume2 className="w-8 h-8 animate-bounce" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </button>

        <div>
          <div className="text-base font-semibold text-white">
            {connectionState === 'listening' 
              ? (lang === 'bn' ? 'শুনছি... বলুন' : 'Listening... Speak now')
              : connectionState === 'thinking'
              ? (lang === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Checking...')
              : connectionState === 'speaking'
              ? (lang === 'bn' ? 'কথা বলছি...' : 'Speaking...')
              : (lang === 'bn' ? 'কথা বলতে ট্যাপ করুন' : 'Tap to speak')}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'bn' 
              ? 'বাংলায় স্বাভাবিকভাবে প্রশ্ন করুন বা মেসেজটি পড়ে শোনান'
              : 'Speak naturally in Bangla or English'}
          </p>
        </div>
      </div>

      {/* User Speech Display */}
      {userTranscript && (
        <div className="rounded-xl bg-slate-800/80 border border-slate-700/60 p-3 text-sm">
          <span className="text-xs text-slate-400 block mb-1">
            {lang === 'bn' ? 'আপনি বলেছেন:' : 'You said:'}
          </span>
          <p className="text-white font-medium">{userTranscript}</p>
        </div>
      )}

      {/* AI Reply Display (Prominent with Listen Button) */}
      <div className="rounded-xl bg-slate-950/70 border border-emerald-500/30 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            {lang === 'bn' ? 'TakaBondhu-র উত্তর:' : 'TakaBondhu Response:'}
          </span>

          {aiReply && (
            <button
              onClick={() => speakText(aiReply)}
              className="flex items-center gap-1 text-xs text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
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
          <div className="pt-2 border-t border-slate-800/80">
            <button
              onClick={onScrollToAnalyzer}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors"
            >
              <span>{lang === 'bn' ? 'পূর্ণাঙ্গ নিরাপত্তা বিশ্লেষণ দেখুন' : 'View full safety breakdown'}</span>
              <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
        )}
      </div>

      {/* Text Input Fallback (for Firefox, iOS, or typing preference) */}
      <div className="pt-2 border-t border-slate-800">
        <div className="text-xs text-slate-400 mb-2 flex items-center justify-between">
          <span>{lang === 'bn' ? 'অথবা লিখে চেক করুন:' : 'Or type your question:'}</span>
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
              handleAnalyzeText(textInput);
              setTextInput('');
            }
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={lang === 'bn' ? 'যেমন: লটারিতে ২৫,০০০ টাকা জিতেছেন বলে মেসেজ এসেছে...' : 'e.g. Received SMS claiming I won a lottery...'}
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!textInput.trim() || connectionState === 'thinking'}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors shrink-0"
          >
            <span>{lang === 'bn' ? 'যাচাই' : 'Check'}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
