import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import DemoBar from './components/DemoBar';
import Hero from './components/Hero';
import StatsDashboard from './components/StatsDashboard';
import MessageAnalyzer from './components/MessageAnalyzer';
import RiskReport from './components/RiskReport';
import PreSendChecker from './components/PreSendChecker';
import ReviewQueue from './components/ReviewQueue';
import SavingsGuide from './components/SavingsGuide';
import ImpactSimulator from './components/ImpactSimulator';
import MicroTips from './components/MicroTips';
import Footer from './components/Footer';
import Toast from './components/Toast';
import { OFFICIAL_DEMO_SCENARIOS } from './data/sampleScenarios';
import { apiUrl } from './apiConfig';

export default function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/review') return 'review';
      if (path === '/pre-send') return 'pre-send';
      if (path === '/savings') return 'savings-guide';
      if (path === '/impact') return 'impact';
    }
    return 'scam-shield';
  });

  const [report, setReport] = useState(null);
  const [originalMessage, setOriginalMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'voice'
  
  // Accessibility & Localization state
  const [lang, setLang] = useState('en'); // 'en' | 'bn'
  const [isLargeText, setIsLargeText] = useState(false);
  const [activeDemoId, setActiveDemoId] = useState(null);
  const [preSendInitialTx, setPreSendInitialTx] = useState(null);
  const [reviewInitialWallet, setReviewInitialWallet] = useState(null);

  const analyzerRef = useRef(null);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/review') setCurrentPage('review');
      else if (path === '/pre-send') setCurrentPage('pre-send');
      else if (path === '/savings') setCurrentPage('savings-guide');
      else if (path === '/impact') setCurrentPage('impact');
      else setCurrentPage('scam-shield');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (page) => {
    setCurrentPage(page);
    if (page === 'review') {
      window.history.pushState({}, '', '/review');
    } else if (page === 'pre-send') {
      window.history.pushState({}, '', '/pre-send');
    } else if (page === 'savings-guide') {
      window.history.pushState({}, '', '/savings');
    } else if (page === 'impact') {
      window.history.pushState({}, '', '/impact');
    } else {
      window.history.pushState({}, '', '/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToAnalyzer = () => {
    if (analyzerRef.current) {
      analyzerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAnalyze = async (messageText) => {
    setIsLoading(true);
    setError(null);
    setOriginalMessage(messageText);

    try {
      const response = await fetch(apiUrl('/api/analyze'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete message analysis');
      }

      setReport(data);
      setToast({
        type: 'success',
        message: `Analysis completed: Risk Score ${data.riskScore}/100 (${data.riskLevel})`
      });

      setTimeout(() => {
        const resultsEl = document.getElementById('results');
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);

    } catch (err) {
      console.warn('Backend unavailable, using client heuristic fallback:', err);
      // Deterministic offline fallback if backend down
      const isOtp = /otp|pin|পিন|কোড|code/i.test(messageText);
      const isFee = /ফি|fee|charge|advance|আগাম|টাকা পাঠান/i.test(messageText);
      const fallbackScore = isOtp ? 94 : (isFee ? 82 : 25);
      const fallbackReport = {
        riskScore: fallbackScore,
        riskLevel: fallbackScore >= 80 ? 'CRITICAL' : (fallbackScore >= 50 ? 'MEDIUM' : 'LOW'),
        summary: isOtp ? 'Detected high-risk credential solicitation pattern.' : 'Standard text analyzed in offline mode.',
        signals: isOtp ? [{ type: 'OTP_HARVEST_SIGNAL', points: 50, explanation: 'Never share OTPs with third parties.' }] : [],
        case_card: {
          what_happened: 'Message analyzed locally via offline heuristics.',
          why_risky: isOtp ? 'OTP disclosure directly allows unauthorized wallet drain.' : 'Standard communication pattern.',
          what_upay_should_do: isOtp ? 'Warn user and enforce PIN confirmation.' : 'Allow normal transaction.'
        },
        decision_recommendation: fallbackScore >= 70 ? 'HOLD_FOR_REVIEW' : 'ALLOW',
        requires_human_review: fallbackScore >= 80
      };
      setReport(fallbackReport);
      setToast({
        type: 'info',
        message: `Offline analysis: Risk Score ${fallbackScore}/100`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDemo = (scenario) => {
    setActiveDemoId(scenario.id);

    if (scenario.id === 'demo-fake-agent' || scenario.id === 'demo-otp-harvest' || scenario.id === 'demo-benign-lookalike') {
      setCurrentPage('scam-shield');
      setOriginalMessage(scenario.inputText);
      handleAnalyze(scenario.inputText);
      setToast({
        type: 'success',
        message: `Demo Active: ${scenario.name}`
      });
    } else if (scenario.id === 'demo-account-takeover') {
      setPreSendInitialTx(scenario.transactionData);
      setCurrentPage('pre-send');
      setToast({
        type: 'info',
        message: `Demo Active: Account Takeover (ATO) pre-loaded in Pre-Send Checker`
      });
    } else if (scenario.id === 'demo-mule-ring') {
      setReviewInitialWallet(scenario.muleWallet);
      setCurrentPage('review');
      setToast({
        type: 'info',
        message: `Demo Active: Mule Network Graph loaded for wallet ${scenario.muleWallet}`
      });
    } else if (scenario.id === 'demo-agent-anomaly') {
      setCurrentPage('review');
      setToast({
        type: 'info',
        message: `Demo Active: Agent Structuring Anomaly (Agent ${scenario.agentId}) loaded in Fraud Ops`
      });
    }
  };

  return (
    <div className={`min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 ${isLargeText ? 'text-lg leading-relaxed' : ''}`}>
      
      {/* Navigation Bar */}
      <Navbar 
        currentPage={currentPage}
        onNavigate={handleNavigate}
        lang={lang}
        setLang={setLang}
        isLargeText={isLargeText}
        setIsLargeText={setIsLargeText}
        onSelectVoice={() => {
          handleNavigate('scam-shield');
          setActiveTab('voice');
          setTimeout(scrollToAnalyzer, 100);
        }}
      />

      {/* 1-Click Offline Demo Mode Bar */}
      <DemoBar 
        activeDemoId={activeDemoId}
        onSelectDemo={handleSelectDemo}
        lang={lang}
      />

      <main className="flex-grow">
        {currentPage === 'scam-shield' && (
          <>
            {/* Hero Section */}
            <Hero 
              onAnalyzeClick={() => {
                setActiveTab('text');
                scrollToAnalyzer();
              }}
              onVoiceClick={() => {
                setActiveTab('voice');
                scrollToAnalyzer();
              }}
              lang={lang}
            />

            {/* Live Telemetry & Model Benchmarks */}
            <StatsDashboard lang={lang} />

            {/* Scam Message & Voice Screener */}
            <MessageAnalyzer 
              analyzerRef={analyzerRef}
              onAnalyze={handleAnalyze}
              isLoading={isLoading}
              error={error}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              initialText={originalMessage}
              lang={lang}
            />

            {/* Risk Intelligence Report */}
            {report && (
              <RiskReport 
                report={report}
                originalMessage={originalMessage}
                onReset={() => setReport(null)}
                lang={lang}
              />
            )}

            {/* Personalized Micro-Tips */}
            <MicroTips 
              detectedPattern={report?.signals?.[0]?.type || null}
              lang={lang}
            />
          </>
        )}

        {currentPage === 'pre-send' && (
          /* Pre-Send Transfer Screener with Soft Friction */
          <div className="py-8">
            <PreSendChecker initialTx={preSendInitialTx} lang={lang} />
          </div>
        )}

        {currentPage === 'savings-guide' && (
          /* Track 03: Taka Plan Savings Coach */
          <SavingsGuide lang={lang} />
        )}

        {currentPage === 'review' && (
          /* Track 01: Fraud Ops Review Queue & Mule Network Graph */
          <div className="py-8">
            <ReviewQueue initialWallet={reviewInitialWallet} lang={lang} />
          </div>
        )}

        {currentPage === 'impact' && (
          /* Executive Business ROI Simulator & Frozen Benchmarks */
          <div className="py-8">
            <ImpactSimulator lang={lang} />
          </div>
        )}
      </main>

      {/* Platform Footer */}
      <Footer onNavigate={handleNavigate} lang={lang} />

      {/* Toast Alert */}
      <Toast 
        toast={toast}
        onClose={() => setToast(null)}
      />

    </div>
  );
}
