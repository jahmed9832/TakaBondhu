import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeTransactionsForMuleGraph } from '../server.js';

test('Mule Real Data Engine - accurately computes multi-victim pooling and rapid cash-out structuring', () => {
  const realIncidentTxs = [
    { sender: '01711223344', receiver: '01988776655', amount: 15000, type: 'send_money' },
    { sender: '01822334455', receiver: '01988776655', amount: 18500, type: 'send_money' },
    { sender: '01933445566', receiver: '01988776655', amount: 12000, type: 'send_money' },
    { sender: '01988776655', receiver: 'agent_0001', amount: 44000, type: 'cash_out' }
  ];

  const result = analyzeTransactionsForMuleGraph('01988776655', realIncidentTxs);

  assert.equal(result.wallet_id, '01988776655');
  assert.equal(result.is_mule_suspect, true, 'Multi-victim funnel to agent cashout must be flagged as mule suspect');
  assert.ok(result.risk_score >= 80, `Risk score should be high (>=80), got ${result.risk_score}`);
  assert.equal(result.total_inflow, 45500);
  assert.equal(result.total_outflow, 44000);
  assert.equal(result.unique_senders, 3);
  assert.equal(result.unique_receivers, 1);

  // Verify graph topology
  assert.equal(result.edges.length, 4);
  const inflows = result.edges.filter(e => e.direction === 'inflow');
  const outflows = result.edges.filter(e => e.direction === 'outflow');
  assert.equal(inflows.length, 3);
  assert.equal(outflows.length, 1);
  assert.equal(outflows[0].target, 'agent_0001');

  // Verify node structure
  const targetNode = result.nodes.find(n => n.id === '01988776655');
  assert.ok(targetNode, 'Target node must exist');
  assert.equal(targetNode.is_target, true);
  assert.equal(targetNode.is_mule, true);
});

test('Mule Real Data Engine - correctly classifies benign low-volume consumer activity', () => {
  const benignTxs = [
    { sender: '01711000001', receiver: '01811000002', amount: 2500, type: 'send_money' },
    { sender: '01811000002', receiver: 'merch_0001', amount: 1850, type: 'merchant_pay' }
  ];

  const result = analyzeTransactionsForMuleGraph('01811000002', benignTxs);

  assert.equal(result.wallet_id, '01811000002');
  assert.equal(result.is_mule_suspect, false, 'Standard peer and merchant transactions should not be flagged as mule');
  assert.ok(result.risk_score <= 30, `Benign risk score should be low, got ${result.risk_score}`);
  assert.equal(result.total_inflow, 2500);
  assert.equal(result.total_outflow, 1850);
  assert.equal(result.unique_senders, 1);
});

test('Mule Real Data Engine - detects structured round-amount cash-out batches', () => {
  const structuredTxs = [
    { sender: '01711000010', receiver: 'target_hub', amount: 20000, type: 'send_money' },
    { sender: '01711000020', receiver: 'target_hub', amount: 20000, type: 'send_money' },
    { sender: 'target_hub', receiver: 'agent_0002', amount: 39500, type: 'cash_out' }
  ];

  const result = analyzeTransactionsForMuleGraph('target_hub', structuredTxs);
  assert.ok(result.risk_score >= 60, `Structured round transactions should elevate risk, got ${result.risk_score}`);
  assert.ok(result.reasons.some(r => r.includes('round amounts') || r.includes('Rapid fund drain')), 'Reason codes must highlight structuring or rapid drain');
});
