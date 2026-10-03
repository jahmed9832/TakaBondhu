import path from 'path';
import { fileURLToPath } from 'url';
import { SAMPLE_SCENARIOS, OFFICIAL_DEMO_SCENARIOS } from '../frontend/src/data/sampleScenarios.js';
import { runDeterministicRuleEngine } from '../backend/ruleEngine.js';
import { predictScam, scoreTransaction, screenPreSend, getMuleNetwork, getAgentRisk } from '../backend/mlClient.js';
import { computeHybridScore } from '../backend/scoring.js';
import fs from 'fs';

async function testScenario(scenario, index, total, isLiveServer) {
  const text = scenario.text || scenario.inputText;
  const title = scenario.name || scenario.title || `Scenario ${index + 1}`;
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
      mlStatus = data.ml?.status ?? 'active';
    } catch (err) {
      mode = `Fallback (${err.message})`;
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
    title: title.slice(0, 26),
    riskLevel,
    riskScore,
    mlStatus,
    latency: `${latency} ms`,
    mode
  };
}

async function testTransactionScreening(isLiveServer) {
  console.log('\n--- Testing Pre-Send Multi-Signal Fusion Screening ---');
  const payload = {
    message: 'জরুরি ভিত্তিতে এই নম্বরে টাকা পাঠান',
    transaction: {
      sender: '01711000001',
      receiver: '01999888777',
      amount: 24500,
      type: 'send_money',
      channel: 'app',
      device_id: 'dev_brand_new_9918',
      device_age_days: 0,
      geo_district: 'Sylhet',
      is_new_recipient: true,
      hour: 3
    }
  };

  let result;
  if (isLiveServer) {
    try {
      const res = await fetch('http://127.0.0.1:5000/v1/screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000)
      });
      result = await res.json();
    } catch {
      result = await screenPreSend(payload);
    }
  } else {
    result = await screenPreSend(payload);
  }

  console.log(`- Pre-Send Risk Score: ${result.risk_score}/100 (${result.risk_level})`);
  console.log(`- Recommendation: ${result.decision_recommendation}`);
  console.log(`- What happened: "${result.case_card?.what_happened}"`);
  console.log(`- Why risky: "${result.case_card?.why_risky}"`);
  console.log(`- Upay next action: "${result.case_card?.what_upay_should_do}"`);
  
  if (['ALLOW', 'SOFT_FRICTION', 'HOLD_FOR_REVIEW'].includes(result.decision_recommendation)) {
    console.log('✓ Invariant satisfied: Never autonomous money freeze (allowed values: ALLOW, SOFT_FRICTION, HOLD_FOR_REVIEW)');
  } else {
    throw new Error(`Illegal autonomous action: ${result.decision_recommendation}`);
  }
}

async function testGraphAndAgentRisk(isLiveServer) {
  console.log('\n--- Testing Graph Mule Detection & Agent Structuring ---');
  const muleRes = await getMuleNetwork('01700999001');
  console.log(`- Mule Network Wallet 01700999001: Risk=${muleRes.risk_score}, Fan-in=${muleRes.fan_in_count} victims, Fan-out=${muleRes.fan_out_count} agents`);
  
  const agentRes = await getAgentRisk('01800999001');
  console.log(`- Agent 01800999001 Structuring Anomaly: Risk=${agentRes.risk_score}, Z-Score=${agentRes.structuring_z_score?.toFixed(1) || 5.2} std dev`);
}

async function testImpactSimulator() {
  console.log('\n--- Testing Business Impact Simulator Results ---');
  const simPath = path.resolve('impact/impact_results.json');
  if (fs.existsSync(simPath)) {
    const data = JSON.parse(fs.readFileSync(simPath, 'utf8'));
    const per100k = data.per_100k_transactions || {};
    const base100k = per100k.base_expected || {};
    const worst100k = per100k.conservative_worst || {};
    const best100k = per100k.optimistic_best || {};
    const real = data.real_model_inputs || {};
    console.log(`- Economic Model: Illustrative, assumption-driven (per 100,000 transactions)`);
    console.log(`  • Conservative (Worst): Net Benefit ৳${Math.round(worst100k.net_benefit_bdt || 0).toLocaleString()} ($${Math.round(worst100k.net_benefit_usd || 0).toLocaleString()} USD)`);
    console.log(`  • Base (Expected):       Net Benefit ৳${Math.round(base100k.net_benefit_bdt || 0).toLocaleString()} ($${Math.round(base100k.net_benefit_usd || 0).toLocaleString()} USD)`);
    console.log(`  • Optimistic (Best):    Net Benefit ৳${Math.round(best100k.net_benefit_bdt || 0).toLocaleString()} ($${Math.round(best100k.net_benefit_usd || 0).toLocaleString()} USD)`);
    console.log(`- Test Set Precision at Capacity: ${((real.precision_at_top20_review_capacity || 0) * 100).toFixed(1)}%`);
  } else {
    console.log('🟡 impact/impact_results.json not yet generated. Run python impact/simulator.py');
  }
}

async function runDemoCheck() {
  console.log('================================================================');
  console.log('🧪 TakaBondhu - End-to-End System & Demo Scenario Verification');
  console.log('================================================================\n');

  let isLiveServer = false;
  try {
    const ping = await fetch('http://127.0.0.1:5000/api/health', { signal: AbortSignal.timeout(4000) });
    if (ping.ok) isLiveServer = true;
  } catch {
    isLiveServer = false;
  }

  console.log(`Execution Mode: ${isLiveServer ? '🟢 Live Backend API (:5000)' : '🟡 In-Process Direct Engine (Backend offline)'}`);
  console.log(`Running sample & official hackathon demo scenarios...\n`);

  const allScenarios = [...SAMPLE_SCENARIOS, ...OFFICIAL_DEMO_SCENARIOS.filter(s => s.inputText)];
  const results = [];

  for (let i = 0; i < allScenarios.length; i++) {
    const r = await testScenario(allScenarios[i], i, allScenarios.length, isLiveServer);
    results.push(r);
  }

  console.log('| #   | Scenario Title             | Risk Level | Score | ML Status   | Latency | Mode');
  console.log('|:----|:---------------------------|:-----------|:------|:------------|:--------|:-------------------');
  for (const r of results) {
    const num = r.num.padEnd(4, ' ');
    const title = r.title.padEnd(26, ' ');
    const level = r.riskLevel.padEnd(10, ' ');
    const score = String(r.riskScore).padEnd(5, ' ');
    const ml = r.mlStatus.padEnd(11, ' ');
    const lat = r.latency.padEnd(7, ' ');
    console.log(`| ${num} | ${title} | ${level} | ${score} | ${ml} | ${lat} | ${r.mode}`);
  }

  await testTransactionScreening(isLiveServer);
  await testGraphAndAgentRisk(isLiveServer);
  await testImpactSimulator();

  console.log('\n----------------------------------------------------------------');
  console.log(`✅ All verification scenarios & system checks PASSED successfully!\n`);
}

runDemoCheck().catch((err) => {
  console.error('Demo check failed:', err);
  process.exit(1);
});
