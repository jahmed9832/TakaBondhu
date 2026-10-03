import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

test('ImpactSimulator has zero hardcoded ML performance constants', () => {
  const componentPath = path.join(ROOT_DIR, 'frontend/src/components/ImpactSimulator.jsx');
  assert.ok(fs.existsSync(componentPath), 'ImpactSimulator.jsx must exist');
  
  const content = fs.readFileSync(componentPath, 'utf8');

  // Forbidden hand-typed constants that must be loaded via API
  const forbiddenPatterns = [
    /const\s+recallAtCapacity\s*=/i,
    /const\s+precisionAtCapacity\s*=/i,
    /const\s+fpr\s*=\s*0\.0041/i,
    /0\.8226/
  ];

  for (const pattern of forbiddenPatterns) {
    assert.strictEqual(
      pattern.test(content),
      false,
      `ImpactSimulator.jsx must not contain hand-typed constant matching ${pattern}. All metrics must be loaded via GET /v1/impact/config.`
    );
  }
});

test('Impact config loads assumptions and real evaluation results without hand-typed metrics', () => {
  const assumptionsPath = path.join(ROOT_DIR, 'impact/assumptions.json');
  const resultsPath = path.join(ROOT_DIR, 'ml/reports/results.json');

  assert.ok(fs.existsSync(assumptionsPath), 'assumptions.json exists');
  assert.ok(fs.existsSync(resultsPath), 'results.json exists');

  const assumptions = JSON.parse(fs.readFileSync(assumptionsPath, 'utf8'));
  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

  const tri = results.transaction_risk_intelligence || {};
  const recallAtCapacity = tri.review_capacity?.test_time?.top_20_per_1000?.recall_at_k;

  assert.ok(typeof recallAtCapacity === 'number', 'results.json must contain recall_at_k for top_20_per_1000');
  assert.ok(recallAtCapacity > 0.50 && recallAtCapacity < 1.0, 'recall_at_k must be between 50% and 100%');
  assert.ok(assumptions.avg_loss_per_successful_scam_bdt?.value > 0, 'avg loss must be positive');
  assert.ok(assumptions.attempt_success_rate?.value > 0, 'attempt success rate must be positive');
});
