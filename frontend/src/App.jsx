import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import StatsDashboard from './components/StatsDashboard';
import MessageAnalyzer from './components/MessageAnalyzer';
import RiskReport from './components/RiskReport';
import ReviewQueue from './components/ReviewQueue';
import SavingsGuide from './components/SavingsGuide';
import Footer from './components/Footer';
import Toast from './components/Toast';

export default function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/review') {
      return 'review';
    }
    return 'scam-shield';
  });
  const [report, setReport] = useState(null);
  const [originalMessage, setOriginalMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'voice'

  const analyzerRef = useRef(null);

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/review') {
        setCurrentPage('review');
      } else {
        setCurrentPage('scam-shield');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (page) => {
    setCurrentPage(page);
    if (page === 'review') {
      window.history.pushState({}, '', '/review');
    } else if (page === 'savings-guide') {
      window.history.pushState({}, '', '/savings');
    } else {
      window.history.pushState({}, '', '/');
    }
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
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      // Smooth scroll down to results after state update
      setTimeout(() => {
        const resultsEl = document.getElementById('results');
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);

    } catch (err) {
      console.error('Error during analysis:', err);
      setError(err.message || 'Unable to connect to AI analyzer. Please check backend server.');
      setToast({
        type: 'error',
        message: err.message || 'Analysis failed. Check backend connection.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Navigation Bar */}
      <Navbar 
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onSelectVoice={() => {
          handleNavigate('scam-shield');
          setActiveTab('voice');
          setTimeout(scrollToAnalyzer, 100);
        }}
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
            />

            {/* Live Telemetry & Model Benchmarks */}
            <StatsDashboard />

            {/* Scam Message & Voice Analyzer */}
            <MessageAnalyzer 
              analyzerRef={analyzerRef}
              onAnalyze={handleAnalyze}
              isLoading={isLoading}
              error={error}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />

            {/* Risk Intelligence Report */}
            {report && (
              <RiskReport 
                report={report}
                originalMessage={originalMessage}
                onReset={() => setReport(null)}
              />
            )}
          </>
        )}

        {currentPage === 'savings-guide' && (
          /* Savings Guide Page (Preserved as requested) */
          <SavingsGuide />
        )}

        {currentPage === 'review' && (
          /* Simulated Analyst Review Queue */
          <ReviewQueue />
        )}
      </main>

      {/* Platform Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Toast Alert */}
      <Toast 
        toast={toast}
        onClose={() => setToast(null)}
      />

    </div>
  );
}
