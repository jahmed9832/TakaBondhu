import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import DemoBar from './components/DemoBar';
import Hero from './components/Hero';
import MessageAnalyzer from './components/MessageAnalyzer';
import RiskReport from './components/RiskReport';
import PreSendChecker from './components/PreSendChecker';
import ReviewQueue from './components/ReviewQueue';
import SavingsGuide from './components/SavingsGuide';
import MicroTips from './components/MicroTips';
import Footer from './components/Footer';
import Toast from './components/Toast';
import { apiUrl } from './apiConfig';

export default function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/review' || path === '/impact') return 'review';
      if (path === '/pre-send') return 'pre-send';
      if (path === '/savings') return 'savings-guide';
    }
    return 'scam-shield';
  });

  const [fraudSection, setFraudSection] = useState(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/impact') {
      return 'saved';
    }
    return 'queue';
  });

  const [report, setReport] = useState(null);
  const [originalMessage, setOriginalMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'voice'
  
  // Accessibility & Localization state (Bangla default)
  const [lang, setLang] = useState('bn'); // 'bn' | 'en'
  const [isLargeText, setIsLargeText] = useState(false);
  const [activeDemoId, setActiveDemoId] = useState(null);
  const [preSendInitialTx, setPreSendInitialTx] = useState(null);
  const [reviewInitialWallet, setReviewInitialWallet] = useState(null);

  const analyzerRef = useRef(null);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/review') {
        setCurrentPage('review');
      } else if (path === '/impact') {
        setCurrentPage('review');
        setFraudSection('saved');
      } else if (path === '/pre-send') {
        setCurrentPage('pre-send');
      } else if (path === '/savings') {
        setCurrentPage('savings-guide');
      } else {
        setCurrentPage('scam-shield');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (page) => {
    if (page === 'impact') {
      setCurrentPage('review');
      setFraudSection('saved');
      window.history.pushState({}, '', '/review');
    } else {
      setCurrentPage(page);
      if (page === 'review') {
        window.history.pushState({}, '', '/review');
      } else if (page === 'pre-send') {
        window.history.pushState({}, '', '/pre-send');
      } else if (page === 'savings-guide') {
        window.history.pushState({}, '', '/savings');
      } else {
        window.history.pushState({}, '', '/');
      }
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
        message: lang === 'bn' 
          ? `যাচাই সম্পন্ন: ঝুঁকি স্কোর ${data.riskScore}/১০০` 
          : `Analysis completed: Risk Score ${data.riskScore}/100`
      });

      setTimeout(() => {
        const resultsEl = document.getElementById('results');
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);

    } catch (err) {
      console.warn('Backend unavailable, using client heuristic fallback:', err);
      const isOtp = /otp|pin|পিন|কোড|code/i.test(messageText);
      const isFee = /ফি|fee|charge|advance|আগাম|টাকা পাঠান/i.test(messageText);
      const fallbackScore = isOtp ? 94 : (isFee ? 82 : 25);
      const fallbackReport = {
        riskScore: fallbackScore,
        riskLevel: fallbackScore >= 80 ? 'CRITICAL' : (fallbackScore >= 50 ? 'MEDIUM' : 'LOW'),
        summary: isOtp 
          ? 'গোপন ওটিপি বা পিন চাওয়ার লক্ষণ শনাক্ত করা হয়েছে।' 
          : 'অফলাইন মোডে বার্তা পরীক্ষা করা হয়েছে।',
        signals: isOtp ? [{ type: 'OTP_HARVEST_SIGNAL', points: 50, explanation: 'কখনোই পিন বা ওটিপি কাউকে দেবেন না।' }] : [],
        case_card: {
          what_happened: 'অফলাইন নিয়মে বার্তাটি পরীক্ষা করা হয়েছে।',
          why_risky: isOtp ? 'ওটিপি দিলে অ্যাকাউন্ট থেকে টাকা চুরি হতে পারে।' : 'সাধারণ বার্তা।',
          what_upay_should_do: isOtp ? 'গ্রাহককে সতর্ক করুন।' : 'স্বাভাবিক বার্তা।'
        },
        decision_recommendation: fallbackScore >= 70 ? 'HOLD_FOR_REVIEW' : 'ALLOW',
        requires_human_review: fallbackScore >= 80
      };
      setReport(fallbackReport);
      setToast({
        type: 'info',
        message: lang === 'bn' 
          ? `অফলাইন মোডে যাচাই: ঝুঁকি স্কোর ${fallbackScore}/১০০` 
          : `Offline analysis: Risk Score ${fallbackScore}/100`
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
        message: `${lang === 'bn' ? 'ডেমো সক্রিয়:' : 'Demo Active:'} ${lang === 'bn' ? scenario.nameBn : scenario.name}`
      });
    } else if (scenario.id === 'demo-account-takeover') {
      setPreSendInitialTx(scenario.transactionData);
      setCurrentPage('pre-send');
      setToast({
        type: 'info',
        message: lang === 'bn' 
          ? 'ডেমো সক্রিয়: একাউন্ট দখল (ATO) লেনদেন প্রি-লোড হয়েছে' 
          : 'Demo Active: Account Takeover (ATO) pre-loaded in Pre-Send Checker'
      });
    } else if (scenario.id === 'demo-mule-ring') {
      setReviewInitialWallet(scenario.muleWallet);
      setFraudSection('graph');
      setCurrentPage('review');
      setToast({
        type: 'info',
        message: lang === 'bn' 
          ? `ডেমো সক্রিয়: মিউল নেটওয়ার্ক গ্রাফ (ওয়ালেট: ${scenario.muleWallet})` 
          : `Demo Active: Mule Network Graph loaded for wallet ${scenario.muleWallet}`
      });
    } else if (scenario.id === 'demo-agent-anomaly') {
      setFraudSection('queue');
      setCurrentPage('review');
      setToast({
        type: 'info',
        message: lang === 'bn' 
          ? `ডেমো সক্রিয়: অস্বাভাবিক এজেন্ট স্মারফিং (এজেন্ট: ${scenario.agentId})` 
          : `Demo Active: Agent Structuring Anomaly (Agent ${scenario.agentId}) loaded in Fraud Ops`
      });
    }
  };

  return (
    <div className={`min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 ${isLargeText ? 'text-lg leading-relaxed' : ''}`}>
      
      {/* 4-Tab Navigation Bar */}
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

      {/* Small Collapsible Demo Bar */}
      <DemoBar 
        activeDemoId={activeDemoId}
        onSelectDemo={handleSelectDemo}
        lang={lang}
      />

      <main className="flex-grow">
        {currentPage === 'scam-shield' && (
          <>
            {/* Clean Hero Section */}
            <Hero 
              onAnalyzeClick={() => {
                setActiveTab('text');
                scrollToAnalyzer();
              }}
              onBeforeSendClick={() => handleNavigate('pre-send')}
              onVoiceClick={() => {
                setActiveTab('voice');
                scrollToAnalyzer();
              }}
              lang={lang}
            />

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
          <div className="py-6">
            <PreSendChecker initialTx={preSendInitialTx} lang={lang} isLargeText={isLargeText} />
          </div>
        )}

        {currentPage === 'savings-guide' && (
          /* Track 03: Taka Plan Savings Coach */
          <SavingsGuide lang={lang} />
        )}

        {currentPage === 'review' && (
          /* Track 01: Fraud Ops Review Queue, Mule Network Graph & Money Saved */
          <div className="py-6">
            <ReviewQueue 
              initialWallet={reviewInitialWallet} 
              initialSection={fraudSection}
              lang={lang} 
            />
          </div>
        )}
      </main>

      {/* Minimal Platform Footer */}
      <Footer onNavigate={handleNavigate} lang={lang} />

      {/* Toast Alert */}
      <Toast 
        toast={toast}
        onClose={() => setToast(null)}
      />

    </div>
  );
}
