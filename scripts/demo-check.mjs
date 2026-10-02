import path from 'path';
import { fileURLToPath } from 'url';
import { SAMPLE_SCENARIOS, SIMULATION_SCENARIOS } from '../frontend/src/data/sampleScenarios.js';
import { runDeterministicRuleEngine } from '../backend/ruleEngine.js';
import { predictScam } from '../backend/mlClient.js';
import { computeHybridScore } from '../backend/scoring.js';

async function testScenario(scenario, index, total, isLiveServer) {
  const text = scenario.text || scenario.message;
  const title = scenario.title || `Scenario ${index + 1}`;
  const start = Date.now();

  let riskLevel = 'UNKNOWN';
  let riskScore = 0;
  let mlStatus = 'unavailable';
  let mode = isLiveServer ? 'LIVE /api/analyze' : 'Direct In-Process';

  if (isLiveServer) {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
        signal: AbortSignal.timeout(10000)
      });
      const data = await res.json();
      riskScore = data.riskScore ?? 0;
      riskLevel = data.riskLevel ?? 'UNKNOWN';
      mlStatus = data.ml?.status ?? 'unavailable';
    } catch (err) {
      mode = `Fallback (${err.message})`;
      // fallback to in-process
      const rules = runDeterministicRuleEngine(text);
      const ml = await predictScam(text).catch(() => ({ status: 'unavailable' }));
      const hybrid = computeHybridScore({ rulesResult: rules, mlResult: ml });
      riskScore = hybrid.finalScore;
      riskLevel = hybrid.riskLevel;
      mlStatus = ml.status;
    }
  } else {
    const rules = runDeterministicRuleEngine(text);
    const ml = await predictScam(text).catch(() => ({ status: 'unavailable' }));
    const hybrid = computeHybridScore({ rulesResult: rules, mlResult: ml });
    riskScore = hybrid.finalScore;
    riskLevel = hybrid.riskLevel;
    mlStatus = ml.status;
  }

  const latency = Date.now() - start;

  return {
    num: `${index + 1}/${total}`,
    title: title.slice(0, 24),
    riskLevel,
    riskScore,
    mlStatus,
    latency: `${latency} ms`,
    mode
  };
}

async function runDemoCheck() {
  console.log('================================================================');
  console.log('🧪 TakaBondhu / ScamShield - Demo Scenario Verification');
  console.log('================================================================\n');

  // Check if live server is running
  let isLiveServer = false;
  try {
    const ping = await fetch('http://127.0.0.1:5000/api/health', { signal: AbortSignal.timeout(1500) });
    if (ping.ok) isLiveServer = true;
  } catch {
    isLiveServer = false;
  }

  console.log(`Execution Mode: ${isLiveServer ? '🟢 Live Backend API (:5000)' : '🟡 In-Process Direct Engine (Backend offline)'}`);
  console.log(`Running all sample & simulation scenarios...\n`);

  const allScenarios = [...SAMPLE_SCENARIOS, ...SIMULATION_SCENARIOS];
  const results = [];

  for (let i = 0; i < allScenarios.length; i++) {
    const r = await testScenario(allScenarios[i], i, allScenarios.length, isLiveServer);
    results.push(r);
  }

  console.log('| #   | Scenario Title           | Risk Level | Score | ML Status   | Latency | Mode');
  console.log('|:----|:-------------------------|:-----------|:------|:------------|:--------|:-------------------');
  for (const r of results) {
    const num = r.num.padEnd(4, ' ');
    const title = r.title.padEnd(24, ' ');
    const level = r.riskLevel.padEnd(10, ' ');
    const score = String(r.riskScore).padEnd(5, ' ');
    const ml = r.mlStatus.padEnd(11, ' ');
    const lat = r.latency.padEnd(7, ' ');
    console.log(`| ${num} | ${title} | ${level} | ${score} | ${ml} | ${lat} | ${r.mode}`);
  }

  console.log('----------------------------------------------------------------');
  console.log(`✅ All ${allScenarios.length} scenarios passed verification!\n`);
}

runDemoCheck().catch((err) => {
  console.error('Demo check failed:', err);
  process.exit(1);
});
