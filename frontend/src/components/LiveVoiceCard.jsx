import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  PhoneOff, 
  PhoneCall, 
  Sparkles, 
  ShieldAlert, 
  ShieldCheck, 
  AlertCircle, 
  Volume2, 
  BookOpen, 
  ArrowRight, 
  Activity, 
  Radio, 
  RefreshCw,
  Info
} from 'lucide-react';
import { Room, RoomEvent, Track } from 'livekit-client';

export default function LiveVoiceCard({ onScrollToAnalyzer }) {
  // Connection & Room state
  const [connectionState, setConnectionState] = useState('idle'); // 'idle' | 'requesting_token' | 'connecting' | 'connected' | 'error'
  const [agentState, setAgentState] = useState('idle'); // 'idle' | 'listening' | 'thinking' | 'speaking'
  const [errorMessage, setErrorMessage] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  
  // Transcripts & Live analysis
  const [userTranscript, setUserTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [detectedSignals, setDetectedSignals] = useState([]);
  const [ragStatus, setRagStatus] = useState({ available: false, count: 0 });
  const [livekitConfig, setLivekitConfig] = useState(null);

  // Audio & WebRTC references
  const roomRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioElementsRef = useRef([]);

  // Fetch LiveKit status on mount
  useEffect(() => {
    fetch('/api/livekit/status')
      .then(res => res.json())
      .then(data => {
        setLivekitConfig(data);
      })
      .catch(err => {
        console.warn('Could not query LiveKit status:', err);
      });

    return () => {
      handleEndCall();
    };
  }, []);

  // Web Audio visualizer loop
  useEffect(() => {
    if (connectionState !== 'connected' || !canvasRef.current || !analyserRef.current) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / 24) - 2;
      let x = 2;

      for (let i = 0; i < 24; i++) {
        // Sample frequencies
        const index = Math.floor((i / 24) * (dataArray.length / 2));
        const value = dataArray[index] || 0;
        
        // Base bar height with subtle pulse when speaking/listening
        const isSpeaking = agentState === 'speaking';
        const heightMultiplier = isSpeaking ? 1.4 : (agentState === 'listening' ? 0.9 : 0.4);
        const barHeight = Math.max(4, (value / 255) * canvas.height * 0.8 * heightMultiplier);

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        if (isSpeaking) {
          gradient.addColorStop(0, '#06b6d4'); // Cyan
          gradient.addColorStop(1, '#818cf8'); // Indigo
        } else if (agentState === 'listening') {
          gradient.addColorStop(0, '#10b981'); // Emerald
          gradient.addColorStop(1, '#06b6d4'); // Cyan
        } else {
          gradient.addColorStop(0, '#64748b'); // Slate
          gradient.addColorStop(1, '#94a3b8');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, [2, 2, 0, 0]);
        ctx.fill();

        x += barWidth + 2;
      }
    };

    draw();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [connectionState, agentState]);

  // Client speech recognition (Dual transcription helper for browser UI)
  const startBrowserTranscription = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'bn-BD'; // Default to Bangla

      recognition.onresult = (event) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        if (currentText.trim()) {
          setUserTranscript(currentText);
          setAgentState('listening');

          // Quick deterministic scan preview
          const lower = currentText.toLowerCase();
          const detected = [];
          if (lower.includes('টাকা') || lower.includes('send') || lower.includes('পাঠান')) {
            detected.push({ name: 'Payment Request', severity: 'HIGH' });
          }
          if (lower.includes('বন্ধ') || lower.includes('block') || lower.includes('ব্লক')) {
            detected.push({ name: 'Account Threat', severity: 'CRITICAL' });
          }
          if (lower.includes('এখনই') || lower.includes('জরুরি') || lower.includes('urgent')) {
            detected.push({ name: 'Urgency Pressure', severity: 'HIGH' });
          }
          if (lower.includes('ওটিপি') || lower.includes('otp') || lower.includes('পিন')) {
            detected.push({ name: 'OTP Harvesting', severity: 'CRITICAL' });
          }
          setDetectedSignals(detected);
        }
      };

      recognition.onerror = (err) => {
        if (err.error !== 'no-speech') {
          console.warn('Speech recognition warning:', err.error);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Could not start webkitSpeechRecognition:', e.message);
    }
  };

  // Connect to LiveKit Room
  const handleStartVoice = async () => {
    setErrorMessage(null);
    setConnectionState('requesting_token');
    setUserTranscript('');
    setAiTranscript('আসসালামু আলাইকুম! আমি TakaBondhu-র Voice AI Assistant। কোনো আর্থিক মেসেজ বা সন্দেহজনক ফোন কল নিয়ে সন্দেহ হলে আমাকে বলুন, আমি নিরাপদ পরবর্তী পদক্ষেপ নিতে সাহায্য করব।');
    setDetectedSignals([]);

    // 1. Request microphone access first
    let micStream = null;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000,
          channelCount: 1
        } 
      });
      micStreamRef.current = micStream;

      // Initialize Web Audio API Analyser for visualizer
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(micStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
    } catch (micErr) {
      console.error('Microphone permission error:', micErr);
      setConnectionState('error');
      setErrorMessage(
        micErr.name === 'NotAllowedError' || micErr.name === 'PermissionDeniedError'
          ? 'Microphone permission was denied. Please allow microphone access in your browser settings to speak with the safety assistant.'
          : 'Could not access microphone: ' + micErr.message
      );
      return;
    }

    // 2. Fetch temporary token from backend
    try {
      const roomName = `takabondhu-${Date.now().toString(36)}`;
      console.log('[VOICE DEBUG] Token requested');
      const res = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName })
      });

      const tokenData = await res.json();

      if (!res.ok || !tokenData.token) {
        if (res.status === 503 || tokenData.configured === false) {
          // LiveKit cloud keys not yet added to backend/.env
          setConnectionState('error');
          setErrorMessage(
            tokenData.error || 'LiveKit Cloud is not yet configured. Please set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET in backend/.env.'
          );
          if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach(t => t.stop());
          }
          return;
        }
        throw new Error(tokenData.error || 'Failed to acquire LiveKit room access token');
      }

      console.log('[VOICE DEBUG] Token generated for room:', tokenData.roomName);
      console.log('[VOICE DEBUG] Frontend connecting to room:', tokenData.roomName);
      setConnectionState('connecting');

      // 3. Initialize LiveKit Room with low-latency voice settings
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
          sampleRate: 24000,
          latency: 0.01
        },
        publishDefaults: {
          dtx: true,
          red: true,
          audioBitrate: 24000
        }
      });

      roomRef.current = room;

      // Handle room events
      room.on(RoomEvent.Connected, () => {
        console.log('[VOICE DEBUG] Frontend connected to room:', room.name);
        setConnectionState('connected');
        setAgentState('listening');
        startBrowserTranscription();
      });

      room.on(RoomEvent.Disconnected, () => {
        console.log('[LiveKit] Room disconnected');
        handleEndCall();
      });

      // Subscribe to audio tracks from the Voice Agent
      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio) {
          console.log('[VOICE DEBUG] Agent audio track subscribed:', participant.identity);
          const audioElement = track.attach();
          audioElement.autoplay = true;
          audioElementsRef.current.push(audioElement);
          setAgentState('speaking');
        }
      });

      // Listen for LiveKit Data Messages (scam analysis, transcripts, agent state from worker)
      room.on(RoomEvent.DataReceived, (payload, participant) => {
        try {
          const text = new TextDecoder().decode(payload);
          const msg = JSON.parse(text);

          if (msg.type === 'scam_analysis' && msg.data) {
            console.log('[VOICE DEBUG] Received scam analysis payload:', msg.data);
            if (Array.isArray(msg.data.signalsDetected) && msg.data.signalsDetected.length > 0) {
              setDetectedSignals(msg.data.signalsDetected.map(s => ({
                name: s.type,
                severity: s.severity || 'HIGH',
                evidence: s.evidence
              })));
            }
            if (msg.data.safestPracticalNextStep) {
              setAiTranscript(msg.data.safestPracticalNextStep);
            }
            setRagStatus({
              available: Boolean(msg.data.ragAvailable),
              count: msg.data.retrievedSafetyGuidance?.length || 0
            });
          } else if (msg.type === 'rag_status' && msg.data) {
            setRagStatus({
              available: Boolean(msg.data.available),
              count: msg.data.count || 0
            });
          } else if (msg.type === 'agent_transcript' && msg.text) {
            setAiTranscript(msg.text);
          } else if (msg.type === 'user_transcript' && msg.text) {
            setUserTranscript(msg.text);
          } else if (msg.type === 'agent_state' && msg.state) {
            setAgentState(msg.state);
          }
        } catch (dataErr) {
          console.warn('[VOICE DEBUG] Error parsing room data packet:', dataErr);
        }
      });

      // Listen for LiveKit native transcription stream
      room.on(RoomEvent.TranscriptionReceived, (segments, participant) => {
        if (!Array.isArray(segments) || segments.length === 0) return;
        const fullText = segments.map(s => s.text).join(' ').trim();
        if (!fullText) return;

        const isAgent = participant?.isAgent || participant?.identity?.includes('agent');
        if (isAgent) {
          setAiTranscript(fullText);
          setAgentState('speaking');
        } else {
          setUserTranscript(fullText);
          setAgentState('listening');
        }
      });

      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const agentSpeaker = speakers.find(s => s.isAgent || s.identity.includes('agent'));
        if (agentSpeaker) {
          setAgentState('speaking');
        } else if (speakers.length > 0) {
          setAgentState('listening');
        } else {
          setAgentState('idle');
        }
      });

      // Connect to LiveKit Cloud WebRTC room
      await room.connect(tokenData.url, tokenData.token);

      // Publish local mic track
      await room.localParticipant.setMicrophoneEnabled(true);

    } catch (err) {
      console.error('Error connecting to LiveKit room:', err);
      setConnectionState('error');
      setErrorMessage(err.message || 'Failed to establish LiveKit audio connection. Check network and LiveKit Cloud credentials.');
      handleEndCall();
    }
  };

  // Disconnect & cleanup
  const handleEndCall = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }

    audioElementsRef.current.forEach(el => {
      try {
        el.pause();
        el.remove();
      } catch {}
    });
    audioElementsRef.current = [];

    if (roomRef.current) {
      try {
        roomRef.current.disconnect();
      } catch {}
      roomRef.current = null;
    }

    setConnectionState('idle');
    setAgentState('idle');
    setIsMuted(false);
  };

  const toggleMute = () => {
    if (!roomRef.current) return;
    const newMuted = !isMuted;
    roomRef.current.localParticipant.setMicrophoneEnabled(!newMuted);
    setIsMuted(newMuted);
  };

  return (
    <div id="live-voice" className="mb-12">
      {/* Main Glassmorphic Card Container */}
      <div className="relative rounded-2xl bg-gradient-to-b from-navy-900/90 to-slate-950/95 border border-cyan-500/20 shadow-2xl shadow-cyan-950/30 overflow-hidden backdrop-blur-xl">
        
        {/* Glow Accent Header */}
        <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="p-6 sm:p-8">
          
          {/* Top Bar: Title & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
            <div>
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
                  <span>TakaBondhu Voice Companion</span>
                </h3>
              </div>
              <p className="text-sm font-medium text-slate-300 mt-1">
                Tell me what happened.
              </p>
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <span className="px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-cyan-300 text-xs font-semibold flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span>Bangla Voice AI (বাংলা)</span>
              </span>
            </div>
          </div>

          {/* Central Interactive Voice Canvas */}
          <div className="py-8 flex flex-col items-center justify-center text-center">
            
            {/* Visual Pulsing Voice Orb */}
            <div className="relative mb-6">
              
              {/* Outer Glow Halo */}
              <div className={`absolute -inset-4 rounded-full blur-xl transition-all duration-700 ${
                agentState === 'speaking' 
                  ? 'bg-cyan-500/30 animate-pulse scale-110' 
                  : agentState === 'listening'
                  ? 'bg-emerald-500/25 animate-pulse'
                  : agentState === 'thinking'
                  ? 'bg-indigo-500/25 animate-spin'
                  : 'bg-cyan-500/10'
              }`}></div>

              {/* Main Orb Center */}
              <div className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                agentState === 'speaking'
                  ? 'bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 border-cyan-300 shadow-lg shadow-cyan-500/50 scale-105'
                  : agentState === 'listening'
                  ? 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 border-emerald-300 shadow-lg shadow-emerald-500/50 scale-105'
                  : agentState === 'thinking'
                  ? 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-600 border-indigo-300 shadow-lg shadow-indigo-500/50'
                  : 'bg-gradient-to-tr from-slate-900 via-slate-800 to-navy-900 border-slate-700 hover:border-cyan-500/50 shadow-md'
              }`}>
                {agentState === 'speaking' ? (
                  <Volume2 className="w-12 h-12 text-white animate-bounce" />
                ) : agentState === 'listening' ? (
                  <Mic className="w-12 h-12 text-white animate-pulse" />
                ) : agentState === 'thinking' ? (
                  <RefreshCw className="w-10 h-10 text-white animate-spin" />
                ) : (
                  <Mic className="w-10 h-10 text-cyan-400 group-hover:scale-110 transition-transform" />
                )}
              </div>
            </div>

            {/* Audio Waveform Canvas */}
            <div className="w-full max-w-xs h-12 mb-4 flex items-center justify-center">
              {connectionState === 'connected' ? (
                <canvas ref={canvasRef} width="300" height="48" className="w-full h-full rounded-lg"></canvas>
              ) : (
                <div className="flex items-center space-x-1.5 opacity-30">
                  {[...Array(16)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1.5 bg-slate-500 rounded-full" 
                      style={{ height: `${8 + (i % 5) * 6}px` }}
                    ></div>
                  ))}
                </div>
              )}
            </div>

            {/* Prompt & Current State Label */}
            <div className="max-w-md mx-auto mb-6">
              {connectionState === 'idle' && (
                <div>
                  <h4 className="text-xl font-bold text-white tracking-tight">
                    Ready
                  </h4>
                  <p className="text-sm font-medium text-cyan-300 mt-1">
                    "Tell me what happened."
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    Click Start Live Voice to speak directly in Bangla with TakaBondhu.
                  </p>
                </div>
              )}

              {connectionState === 'requesting_token' && (
                <div className="flex items-center justify-center space-x-2 text-cyan-300 text-sm">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </div>
              )}

              {connectionState === 'connecting' && (
                <div className="flex items-center justify-center space-x-2 text-amber-300 text-sm">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting to room...</span>
                </div>
              )}

              {connectionState === 'connected' && (
                <div>
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                    <span>
                      {agentState === 'speaking' ? 'Speaking...' : agentState === 'thinking' ? 'Thinking...' : 'Listening...'}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-white">
                    {agentState === 'speaking' ? (
                      <span className="text-cyan-300">Speaking...</span>
                    ) : agentState === 'thinking' ? (
                      <span className="text-indigo-300">Thinking...</span>
                    ) : (
                      <span className="text-emerald-300">Listening...</span>
                    )}
                  </p>
                </div>
              )}

              {connectionState === 'error' && errorMessage && (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs text-left max-w-md mx-auto flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-rose-200 block mb-1">Voice Connection Notice:</span>
                    <p className="leading-relaxed">{errorMessage}</p>
                    <p className="mt-2 text-[11px] text-slate-400">
                      💡 Ensure <code className="text-rose-300">LIVEKIT_URL</code>, <code className="text-rose-300">LIVEKIT_API_KEY</code>, and <code className="text-rose-300">LIVEKIT_API_SECRET</code> are set in <code className="text-rose-300">backend/.env</code> and the voice agent worker is running.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center space-x-3">
              {connectionState !== 'connected' ? (
                <button
                  onClick={handleStartVoice}
                  disabled={connectionState === 'requesting_token' || connectionState === 'connecting'}
                  className="px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-500/50 transition-all active:scale-95 flex items-center space-x-2"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Start Live Voice</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={toggleMute}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all flex items-center space-x-2 ${
                      isMuted 
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
                        : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-4 h-4 text-amber-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
                    <span>{isMuted ? 'Unmute' : 'Mute Mic'}</span>
                  </button>

                  <button
                    onClick={handleEndCall}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all active:scale-95 flex items-center space-x-2"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>End Voice Call</span>
                  </button>
                </>
              )}
            </div>

          </div>

          {/* Realtime Transcripts Display (When in Call or after user speech) */}
          {(userTranscript || aiTranscript) && (
            <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* User Voice Bubble */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center space-x-2 mb-2 text-xs font-semibold text-slate-400">
                  <Mic className="w-3.5 h-3.5 text-cyan-400" />
                  <span>You (Microphone Speech)</span>
                </div>
                <p className="text-sm text-slate-200 italic font-bangla">
                  "{userTranscript || 'Listening to your speech...'}"
                </p>

                {/* Realtime Signals Badges */}
                {detectedSignals.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {detectedSignals.map((sig, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center space-x-1"
                      >
                        <ShieldAlert className="w-2.5 h-2.5" />
                        <span>{sig.name}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Voice Bubble */}
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30">
                <div className="flex items-center space-x-2 mb-2 text-xs font-semibold text-cyan-300">
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>TakaBondhu Voice AI (Spoken Bangla)</span>
                </div>
                <p className="text-sm text-cyan-100 font-bangla leading-relaxed">
                  "{aiTranscript}"
                </p>
                <div className="mt-3 flex items-center space-x-2 text-[10px] text-cyan-400/80">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Rule Engine + RAG grounded financial guidance</span>
                </div>
              </div>

            </div>
          )}

          {/* Phase 4 Architectural Flow: "How It Works" */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-center mb-4">
              Realtime Multi-Tier Voice Architecture
            </h5>
            
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col items-center">
                <Mic className="w-4 h-4 text-cyan-400 mb-1" />
                <span className="font-bold text-white text-[11px]">YOUR VOICE</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Bangla Audio</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col items-center">
                <Radio className="w-4 h-4 text-blue-400 mb-1" />
                <span className="font-bold text-white text-[11px]">REALTIME AI</span>
                <span className="text-[10px] text-slate-400 mt-0.5">LiveKit WebRTC</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col items-center">
                <ShieldAlert className="w-4 h-4 text-amber-400 mb-1" />
                <span className="font-bold text-white text-[11px]">SCAM SIGNALS</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Rule Engine</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col items-center">
                <BookOpen className="w-4 h-4 text-indigo-400 mb-1" />
                <span className="font-bold text-white text-[11px]">RAG SAFETY</span>
                <span className="text-[10px] text-slate-400 mt-0.5">pgvector Base</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col items-center col-span-2 sm:col-span-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1" />
                <span className="font-bold text-white text-[11px]">SAFE NEXT STEP</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Spoken Defense</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
