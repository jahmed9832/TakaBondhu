import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  PiggyBank, 
  TrendingUp, 
  Wallet, 
  Calendar, 
  Mic, 
  MicOff, 
  ArrowRight, 
  Check, 
  Info,
  Clock,
  Target
} from 'lucide-react';
import { apiUrl } from '../apiConfig';

const QUICK_PROMPTS = [
  "আমি প্রতি মাসে ৳৫,০০০ save করতে চাই",
  "আমি ৬ মাসে ৳৫০,০০০ জমাতে চাই",
  "আমি একটা laptop কিনতে টাকা জমাতে চাই",
  "I want to save ৳5,000 every month.",
  "I want to build an emergency fund."
];

export default function SavingsGuide() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: "স্বাগতম TakaBondhu-তে! আমি আপনার Savings Guide। আপনার আয়, খরচ ও লক্ষ্য বুঝে একটি practical savings plan তৈরি করতে সাহায্য করব। আপনি মাসে কত টাকা সঞ্চয় করতে চান, বা কীসের জন্য টাকা জমাতে চান?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState({});
  const [conversationId, setConversationId] = useState(() => `savings-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
  const [activePlan, setActivePlan] = useState(null);

  // Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Send message to Conversational Savings API
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(apiUrl('/api/savings/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: text,
          history: newHistory.map(m => ({ role: m.role, content: m.content })),
          profile: profile
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reach Savings Assistant');
      }

      const data = await response.json();

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      if (data.savingsState || data.state) {
        setProfile(data.savingsState || data.state);
      }

      if (data.plan && data.plan.isComplete) {
        setActivePlan(data.plan);
      }

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply || "Let me know your monthly income and expenses so we can evaluate your goal.",
        plan: data.showPlanCard ? data.plan : null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: "I ran into a temporary connection issue. Please tell me your monthly income and expenses again.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: "স্বাগতম TakaBondhu-তে! আমি আপনার Savings Guide। আপনার আয়, খরচ ও লক্ষ্য বুঝে একটি practical savings plan তৈরি করতে সাহায্য করব। আপনি মাসে কত টাকা সঞ্চয় করতে চান, বা কীসের জন্য টাকা জমাতে চান?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setConversationId(`savings-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
    setProfile({});
    setActivePlan(null);
    setInputMessage('');
  };

  // Ultra-fast Voice Input Handler (SpeechRecognition with real-time interim streaming)
  const toggleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'bn-BD';
      recognition.continuous = false;
      recognition.interimResults = true; // Stream instant live voice transcript

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        let liveTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          liveTranscript += event.results[i][0].transcript;
        }
        if (liveTranscript.trim()) {
          setInputMessage(liveTranscript);
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <div className="py-10 sm:py-16 min-h-[calc(100vh-80px)] flex flex-col justify-between">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 w-full flex-grow flex flex-col">
        
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <PiggyBank className="w-3.5 h-3.5 text-violet-400" />
            <span>TAKABONDHU SAVINGS GUIDE</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Build a savings plan that fits your life.
          </h1>

          <p className="mt-2.5 text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Tell me what you're trying to save for. I'll ask a few questions and help you build a realistic plan.
          </p>
        </div>

        {/* Main Chat Container */}
        <div className="glass-card rounded-3xl border border-slate-800 shadow-2xl flex flex-col flex-grow min-h-[520px] max-h-[750px] overflow-hidden bg-navy-950/90 relative">
          
          {/* Chat Window Top Bar */}
          <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-300">
                <Bot className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>TakaBondhu Savings Guide</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </h3>
                <p className="text-[11px] text-slate-400">Conversational Financial Planning</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleResetChat}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center space-x-1.5"
                title="Restart conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Plan</span>
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-4">
            
            {/* Empty State / Welcome Intro Card */}
            {messages.length === 1 && (
              <div className="my-4 p-6 rounded-2xl bg-navy-900/50 border border-slate-800 text-center max-w-lg mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mx-auto mb-3 text-2xl">
                  💰
                </div>
                <h4 className="text-base font-bold text-white mb-1">
                  Let's build your savings plan.
                </h4>
                <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                  Tell me what you're saving for, or simply tell me how much you'd like to save each month.
                </p>

                {/* Suggested Quick-Start Prompts */}
                <div className="flex flex-wrap gap-2 justify-center text-left">
                  {QUICK_PROMPTS.map((promptText, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(promptText)}
                      className="px-3 py-1.5 rounded-xl text-xs bg-slate-900/90 hover:bg-violet-950/60 border border-slate-800 hover:border-violet-500/50 text-slate-300 hover:text-white transition-all active:scale-95"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Render Messages */}
            {messages.map((msg) => {
              const isUser = msg.role === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 flex-shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] sm:max-w-[75%] space-y-3 ${isUser ? 'items-end' : 'items-start'}`}>
                    {/* Chat Bubble */}
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        isUser
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-sm shadow-md'
                          : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    {/* Inline Savings Plan Card if triggered */}
                    {msg.plan && (
                      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-navy-900 via-navy-950 to-slate-900 border border-slate-700/80 shadow-xl text-left w-full animate-slide-up">
                        
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                          <div className="flex items-center space-x-2">
                            <PiggyBank className="w-4 h-4 text-violet-400" />
                            <span className="text-xs font-mono font-bold uppercase tracking-wider text-violet-300">
                              YOUR SAVINGS PLAN
                            </span>
                          </div>

                          <div className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${
                            msg.plan.isFeasible 
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
                              : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                          }`}>
                            {msg.plan.isFeasible ? 'Achievable ✓' : 'Timeline Tight'}
                          </div>
                        </div>

                        {/* Plan Metrics Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-400 block mb-0.5">Goal</span>
                            <span className="font-bold text-white truncate block">{msg.plan.goalName}</span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-400 block mb-0.5">Monthly Saving</span>
                            <span className="font-bold text-cyan-300 font-mono">৳{msg.plan.monthlySavingsGoal?.toLocaleString()}</span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-400 block mb-0.5">Monthly Income</span>
                            <span className="font-bold text-white font-mono">৳{msg.plan.income?.toLocaleString()}</span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-400 block mb-0.5">Monthly Expenses</span>
                            <span className="font-bold text-white font-mono">৳{msg.plan.expenses?.toLocaleString()}</span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-400 block mb-0.5">Available After Expenses</span>
                            <span className={`font-bold font-mono ${msg.plan.availableMonthlyAmount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              ৳{msg.plan.availableMonthlyAmount?.toLocaleString()}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-400 block mb-0.5">Savings Rate</span>
                            <span className="font-bold text-violet-300 font-mono">{msg.plan.savingsRate}%</span>
                          </div>
                        </div>

                        {/* Feasibility Assessment Line */}
                        <div className={`p-3 rounded-xl border text-xs leading-relaxed mb-4 ${
                          msg.plan.isFeasible
                            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                            : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
                        }`}>
                          {msg.plan.isFeasible ? (
                            <span>✓ Your current target looks achievable based on the numbers you provided.</span>
                          ) : (
                            <span>Your current target suggests saving ৳{msg.plan.monthlySavingsGoal?.toLocaleString()}/mo, which is ~৳{msg.plan.deficit?.toLocaleString()} above your estimated surplus. Consider one of the options below.</span>
                          )}
                        </div>

                        {/* Trade-Off Options (if aggressive) */}
                        {msg.plan.tradeOffOptions && msg.plan.tradeOffOptions.length > 0 && (
                          <div className="space-y-2 mb-4">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                              Options to Consider:
                            </span>
                            {msg.plan.tradeOffOptions.map((opt, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleSendMessage(opt.description)}
                                className="w-full text-left p-2.5 rounded-xl bg-navy-950 border border-slate-800 hover:border-violet-500/40 text-xs text-slate-300 hover:text-white transition-all flex items-start space-x-2"
                              >
                                <ArrowRight className="w-3.5 h-3.5 text-violet-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold text-white block">{opt.title}</span>
                                  <span className="text-[11px] text-slate-400">{opt.description}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Suggested Plan Points */}
                        <div className="space-y-1.5 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
                          <span className="font-bold text-white block mb-1">Your suggested plan:</span>
                          <div className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                            <span>Set aside ৳{msg.plan.monthlySavingsGoal?.toLocaleString()} immediately after receiving income.</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                            <span>Keep remaining surplus as an emergency cushion for unpredicted bills.</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span>Review recurring spending at the end of each month.</span>
                          </div>
                        </div>

                        {/* Responsible AI Disclaimer */}
                        <div className="mt-4 pt-3 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-start space-x-1.5">
                          <Info className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
                          <span>
                            Educational estimate based on your stated inputs. TakaBondhu does not provide certified investment advice or loan decisions.
                          </span>
                        </div>

                      </div>
                    )}

                    {/* Timestamp */}
                    <span className="text-[10px] text-slate-400 block px-1">
                      {msg.timestamp}
                    </span>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 flex-shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex items-center space-x-3 justify-start animate-fade-in">
                <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-4 sm:p-5 border-t border-slate-800/80 bg-slate-900/60">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center space-x-2"
            >
              {/* Optional Voice button */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`p-3 rounded-xl border transition-all ${
                  isListening 
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse' 
                    : 'bg-navy-950 border-slate-800 text-slate-400 hover:text-violet-400 hover:border-slate-700'
                }`}
                title={isListening ? 'Listening (Speak now)' : 'Speak your message'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Text Input */}
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder="Type your message (e.g., 'I want to save ৳5,000 every month')..."
                className="flex-grow bg-navy-950 border border-slate-700/80 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 placeholder:text-slate-400 transition-all"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className={`p-3 rounded-xl font-bold transition-all flex items-center justify-center ${
                  isLoading || !inputMessage.trim()
                    ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700/50'
                    : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-500/20 active:scale-95'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
