import path from 'path';
import fs from 'fs';
import { SAMPLE_SCENARIOS, OFFICIAL_DEMO_SCENARIOS } from '../frontend/src/data/sampleScenarios.js';
import { runDeterministicRuleEngine } from '../backend/ruleEngine.js';
import {
  checkMLHealth,
  predictScam,
  screenPreSend,
  getMuleNetwork,
  getAgentRisk
} from '../backend/mlClient.js';
import { computeHybridScore } from '../backend/scoring.js';

async function testMessageScenario(scenario, index, total, isLiveServer) {
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
    id: scenario.id,
    num: `${index + 1}/${total}`,
    title: title.slice(0, 28),
    riskLevel,
    riskScore,
    mlStatus,
    latency: `${latency} ms`,
    mode
  };
}

async function testTransactionScenario(txnPayload, isLiveServer) {
  let result;
  if (isLiveServer) {
    try {
      const res = await fetch('http://127.0.0.1:5000/v1/screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txnPayload),
        signal: AbortSignal.timeout(10000)
      });
      result = await res.json();
    } catch {
      result = await screenPreSend(txnPayload);
    }
  } else {
    result = await screenPreSend(txnPayload);
  }
  return result;
}

async function testImpactSimulator() {
  console.log('\n--- Business Impact Simulator Validation ---');
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
    console.log('🟡 impact/impact_results.json not found. Run python impact/simulator.py');
  }
}

async function runDemoCheck() {
  console.log('================================================================');
  console.log('🧪 TakaBondhu - End-to-End System & Demo Scenario Verification');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // ASSERTION 1: ML Service Status is ACTIVE
  // -------------------------------------------------------------
  process.stdout.write('1. Checking ML Microservice health on 127.0.0.1:8001... ');
  const mlHealth = await checkMLHealth();
  if (mlHealth.status !== 'active') {
    console.error('\n' + '='.repeat(70));
    console.error('❌ ASSERTION FAILED: ML service is NOT active or healthy!');
    console.error('='.repeat(70));
    console.error(`Current ML service status: "${mlHealth.status}"`);
    console.error('TakaBondhu requires the local FastAPI ML microservice to be running.');
    console.error('\nPlease start the ML service in a separate terminal:');
    console.error('  npm run ml:start');
    console.error('or:');
    console.error('  ml\\.venv\\Scripts\\python.exe -m uvicorn service:app --port 8001 --app-dir ml');
    console.error('='.repeat(70) + '\n');
    process.exit(1);
  }
  console.log(`[PASS] (Status: ${mlHealth.status}, Version: ${mlHealth.modelVersion})\n`);

  let isLiveServer = false;
  try {
    const ping = await fetch('http://127.0.0.1:5000/api/health', { signal: AbortSignal.timeout(2000) });
    if (ping.ok) isLiveServer = true;
  } catch {
    isLiveServer = false;
  }

  console.log(`Backend Mode: ${isLiveServer ? '🟢 Live Backend API (:5000)' : '🟡 In-Process Direct Engine (Backend offline)'}`);
  console.log(`Evaluating all sample and official hackathon demo scenarios...\n`);

  // Evaluate text scenarios
  const allScenarios = [...SAMPLE_SCENARIOS, ...OFFICIAL_DEMO_SCENARIOS.filter(s => s.inputText)];
  const results = [];

  for (let i = 0; i < allScenarios.length; i++) {
    const r = await testMessageScenario(allScenarios[i], i, allScenarios.length, isLiveServer);
    results.push(r);
  }

  console.log('| #   | Scenario Title               | Risk Level | Score | ML Status   | Latency | Mode');
  console.log('|:----|:-----------------------------|:-----------|:------|:------------|:--------|:-------------------');
  for (const r of results) {
    const num = r.num.padEnd(4, ' ');
    const title = r.title.padEnd(28, ' ');
    const level = r.riskLevel.padEnd(10, ' ');
    const score = String(r.riskScore).padEnd(5, ' ');
    const ml = r.mlStatus.padEnd(11, ' ');
    const lat = r.latency.padEnd(7, ' ');
    console.log(`| ${num} | ${title} | ${level} | ${score} | ${ml} | ${lat} | ${r.mode}`);
  }

  // -------------------------------------------------------------
  // ASSERTION 2: Two Message Scams Must Be HIGH or CRITICAL (>= 60)
  // -------------------------------------------------------------
  console.log('\n--- Evaluating Assertions ---');
  const demoFakeAgent = results.find(r => r.id === 'demo-fake-agent');
  const demoOtpHarvest = results.find(r => r.id === 'demo-otp-harvest');

  if (!demoFakeAgent || demoFakeAgent.riskScore < 60 || !['HIGH', 'CRITICAL'].includes(demoFakeAgent.riskLevel)) {
    console.error(`❌ ASSERTION FAILED: Demo Fake Agent score must be >= 60 and level HIGH/CRITICAL. Received score=${demoFakeAgent?.riskScore}, level=${demoFakeAgent?.riskLevel}`);
    process.exit(1);
  }
  console.log(`✓ Assert Passed: Demo Fake Agent is ${demoFakeAgent.riskLevel} (${demoFakeAgent.riskScore}/100)`);

  if (!demoOtpHarvest || demoOtpHarvest.riskScore < 60 || !['HIGH', 'CRITICAL'].includes(demoOtpHarvest.riskLevel)) {
    console.error(`❌ ASSERTION FAILED: Demo OTP Harvest score must be >= 60 and level HIGH/CRITICAL. Received score=${demoOtpHarvest?.riskScore}, level=${demoOtpHarvest?.riskLevel}`);
    process.exit(1);
  }
  console.log(`✓ Assert Passed: Demo OTP Harvest is ${demoOtpHarvest.riskLevel} (${demoOtpHarvest.riskScore}/100)`);

  // -------------------------------------------------------------
  // ASSERTION 3: All Scam Scenarios Must Be >= MEDIUM (>= 35)
  // -------------------------------------------------------------
  const scamIds = ['fake-agent-bn', 'otp-harvest-bn', 'account-takeover', 'prize-scam', 'emergency-request', 'demo-fake-agent', 'demo-otp-harvest'];
  for (const scamId of scamIds) {
    const sc = results.find(r => r.id === scamId);
    if (!sc) continue;
    if (sc.riskScore < 35 || !['MEDIUM', 'HIGH', 'CRITICAL'].includes(sc.riskLevel)) {
      console.error(`❌ ASSERTION FAILED: Scam scenario "${sc.title}" (${sc.id}) must be >= MEDIUM (score >= 35). Received score=${sc.riskScore}, level=${sc.riskLevel}`);
      process.exit(1);
    }
  }
  console.log(`✓ Assert Passed: All scam scenarios scored >= MEDIUM (score ≥ 35/100)`);

  // -------------------------------------------------------------
  // ASSERTION 4: Benign Advisory Must Be LOW (< 35)
  // -------------------------------------------------------------
  const benignIds = ['benign-official', 'demo-benign-lookalike'];
  for (const bId of benignIds) {
    const ben = results.find(r => r.id === bId);
    if (!ben) continue;
    if (ben.riskScore >= 35 || ben.riskLevel !== 'LOW') {
      console.error(`❌ ASSERTION FAILED: Benign advisory "${ben.title}" (${ben.id}) must be LOW (score < 35). Received score=${ben.riskScore}, level=${ben.riskLevel}`);
      process.exit(1);
    }
    console.log(`✓ Assert Passed: Benign advisory "${ben.title}" is LOW (${ben.riskScore}/100)`);
  }

  // -------------------------------------------------------------
  // ASSERTION 5: Transaction Scenarios Must Return HOLD_FOR_REVIEW or SOFT_FRICTION
  // -------------------------------------------------------------
  console.log('\n--- Testing Pre-Send Multi-Signal Fusion Screening ---');
  const txnPayload1 = {
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

  const txnRes1 = await testTransactionScenario(txnPayload1, isLiveServer);
  console.log(`- Pre-Send Fusion Case: Score ${txnRes1.risk_score}/100 (${txnRes1.risk_level}) -> Recommendation: ${txnRes1.decision_recommendation}`);

  const allowedRecs = ['HOLD_FOR_REVIEW', 'SOFT_FRICTION'];
  if (!allowedRecs.includes(txnRes1.decision_recommendation)) {
    console.error(`❌ ASSERTION FAILED: Transaction scenario 1 recommendation must be HOLD_FOR_REVIEW or SOFT_FRICTION. Received: ${txnRes1.decision_recommendation}`);
    process.exit(1);
  }
  console.log(`✓ Assert Passed: Pre-send scenario returned ${txnRes1.decision_recommendation}`);

  const demoAto = OFFICIAL_DEMO_SCENARIOS.find(s => s.id === 'demo-account-takeover');
  if (demoAto?.transactionData) {
    const txnRes2 = await testTransactionScenario({ transaction: demoAto.transactionData }, isLiveServer);
    console.log(`- Official Demo ATO Case: Score ${txnRes2.risk_score}/100 (${txnRes2.risk_level}) -> Recommendation: ${txnRes2.decision_recommendation}`);
    if (txnRes2.decision_recommendation !== 'HOLD_FOR_REVIEW') {
      console.error(`❌ ASSERTION FAILED: Official Demo ATO recommendation must be HOLD_FOR_REVIEW. Received: ${txnRes2.decision_recommendation}`);
      process.exit(1);
    }
    console.log(`✓ Assert Passed: Demo ATO scenario returned HOLD_FOR_REVIEW`);
  }

  // -------------------------------------------------------------
  // ASSERTION 6: No Scenario May Return Autonomous Block
  // -------------------------------------------------------------
  const forbiddenAutonomous = ['BLOCK', 'AUTONOMOUS_BLOCK', 'FREEZE', 'FREEZE_MONEY', 'ACCOUNT_FREEZE'];
  if (forbiddenAutonomous.includes(txnRes1.decision_recommendation)) {
    console.error(`❌ ASSERTION FAILED: Scenario returned illegal autonomous block/freeze: ${txnRes1.decision_recommendation}`);
    process.exit(1);
  }
  console.log(`✓ Assert Passed: Invariant strictly verified — ZERO autonomous account blocks or money freezes.`);

  // -------------------------------------------------------------
  // ASSERTION 7: Graph Mule Discovery (suspect=true, risk>=60, edges>0)
  // -------------------------------------------------------------
  console.log('\n--- Graph Mule Discovery & Agent Structuring ---');
  const muleRes = await getMuleNetwork('01700999001');
  const muleEdges = muleRes.edges?.length || 0;
  console.log(`- Mule Network Wallet 01700999001: Risk=${muleRes.risk_score}, Suspect=${muleRes.is_mule_suspect}, Edges=${muleEdges}`);
  if (!muleRes.is_mule_suspect || (muleRes.risk_score ?? 0) < 60 || muleEdges === 0) {
    console.error(`❌ ASSERTION FAILED: Mule 01700999001 must have is_mule_suspect=true, risk_score>=60, and edges>0. Got suspect=${muleRes.is_mule_suspect}, risk=${muleRes.risk_score}, edges=${muleEdges}`);
    process.exit(1);
  }
  console.log(`✓ Assert Passed: Mule network suspect=true, risk>=60 (${muleRes.risk_score}), edges>0 (${muleEdges})`);

  // -------------------------------------------------------------
  // ASSERTION 8: Agent Structuring Anomaly (risk>=60, |z|>=3)
  // -------------------------------------------------------------
  const agentRes = await getAgentRisk('01800999001');
  const zScore = Math.abs(agentRes.z_scores?.z_structuring ?? 0);
  console.log(`- Agent 01800999001 Structuring: Risk=${agentRes.risk_score}, Z-Score=${zScore}`);
  if ((agentRes.risk_score ?? 0) < 60 || zScore < 3.0) {
    console.error(`❌ ASSERTION FAILED: Agent 01800999001 must have risk_score>=60 and |z|>=3. Got risk=${agentRes.risk_score}, |z|=${zScore}`);
    process.exit(1);
  }
  console.log(`✓ Assert Passed: Agent structuring risk>=60 (${agentRes.risk_score}), |z|>=3 (${zScore})`);

  await testImpactSimulator();

  console.log('\n================================================================');
  console.log('✅ ALL DEMO & SECURITY ASSERTIONS PASSED SUCCESSFULLY!');
  console.log('================================================================');
  console.log('  1. ML Service Status: ACTIVE');
  console.log('  2. Message Scams: HIGH / CRITICAL (score ≥ 60)');
  console.log('  3. General Scam Scenarios: ≥ MEDIUM (score ≥ 35)');
  console.log('  4. Benign Advisories: LOW (score < 35)');
  console.log('  5. Transaction Scenarios: SOFT_FRICTION or HOLD_FOR_REVIEW');
  console.log('  6. Zero Autonomous Blocks: Verified');
  console.log('================================================================\n');
}

runDemoCheck().catch((err) => {
  console.error('\n❌ Demo check failed with unhandled exception:', err);
  process.exit(1);
});
