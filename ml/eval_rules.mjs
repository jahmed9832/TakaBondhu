/**
 * Evaluates the deterministic rule engine (backend/ruleEngine.js) across all dataset rows.
 * Exports rules_scores.csv and computes baseline false positive rate on benign hard negatives.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runDeterministicRuleEngine } from '../backend/ruleEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

// Simple CSV parser for dataset.csv
function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  // Parse header
  const header = parseCSVLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === header.length) {
      const obj = {};
      header.forEach((h, idx) => {
        obj[h] = values[idx];
      });
      rows.push(obj);
    }
  }
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function escapeCSV(val) {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function main() {
  const datasetPath = path.join(DATA_DIR, 'dataset.csv');
  if (!fs.existsSync(datasetPath)) {
    console.error(`Error: ${datasetPath} does not exist. Run ml/generate_dataset.py first.`);
    process.exit(1);
  }

  console.log(`[Eval Rules] Loading dataset from ${datasetPath}...`);
  const content = fs.readFileSync(datasetPath, 'utf-8');
  const rows = parseCSV(content);
  console.log(`[Eval Rules] Processing ${rows.length} rows through backend/ruleEngine.js...`);

  const outputRows = [];
  let totalBenign = 0;
  let benignFlaggedAt40 = 0;
  let benignFlaggedAt50 = 0;
  let totalScam = 0;
  let scamFlaggedAt40 = 0;
  let scamFlaggedAt50 = 0;

  // Track per-scam-type and per-language metrics
  const categoryStats = {};

  for (const row of rows) {
    const res = runDeterministicRuleEngine(row.text);
    const signalTypes = (res.rawSignals || []).map(s => s.type).join(';');
    const score = res.baseScore;
    const label = parseInt(row.label, 10);
    const scamType = row.scam_type;
    const lang = row.language;

    outputRows.push({
      id: row.id,
      rules_score: score,
      signal_types: signalTypes
    });

    if (!categoryStats[scamType]) {
      categoryStats[scamType] = { total: 0, flagged40: 0, flagged50: 0, label };
    }
    categoryStats[scamType].total++;
    if (score >= 40) categoryStats[scamType].flagged40++;
    if (score >= 50) categoryStats[scamType].flagged50++;

    if (label === 0) {
      totalBenign++;
      if (score >= 40) benignFlaggedAt40++;
      if (score >= 50) benignFlaggedAt50++;
    } else {
      totalScam++;
      if (score >= 40) scamFlaggedAt40++;
      if (score >= 50) scamFlaggedAt50++;
    }
  }

  // Also score robustness dataset if it exists
  const robPath = path.join(DATA_DIR, 'robustness.csv');
  if (fs.existsSync(robPath)) {
    console.log(`[Eval Rules] Also scoring robustness dataset ${robPath}...`);
    const robRows = parseCSV(fs.readFileSync(robPath, 'utf-8'));
    for (const row of robRows) {
      const res = runDeterministicRuleEngine(row.text);
      const signalTypes = (res.rawSignals || []).map(s => s.type).join(';');
      outputRows.push({
        id: row.id,
        rules_score: res.baseScore,
        signal_types: signalTypes
      });
    }
  }

  // Write ml/data/rules_scores.csv
  const csvOutLines = ['id,rules_score,signal_types'];
  for (const r of outputRows) {
    csvOutLines.push(`${escapeCSV(r.id)},${r.rules_score},${escapeCSV(r.signal_types)}`);
  }
  const outPath = path.join(DATA_DIR, 'rules_scores.csv');
  fs.writeFileSync(outPath, csvOutLines.join('\n'), 'utf-8');
  console.log(`[Eval Rules] Written ${outputRows.length} rule score records to ${outPath}`);

  // Also save a baseline copy if not already existing
  const baselinePath = path.join(DATA_DIR, 'rules_scores_baseline.csv');
  if (!fs.existsSync(baselinePath)) {
    fs.writeFileSync(baselinePath, csvOutLines.join('\n'), 'utf-8');
    console.log(`[Eval Rules] Saved baseline copy to ${baselinePath}`);
  }

  // Report false positive rates
  console.log('\n============================================================');
  console.log('📊 RULE ENGINE EVALUATION SUMMARY');
  console.log('============================================================');
  console.log(`Total rows evaluated: ${rows.length}`);
  console.log(`  • Benign rows: ${totalBenign}`);
  console.log(`  • Scam rows:   ${totalScam}`);
  console.log('\nFalse Positive Rate (FPR) on Benign Hard Negatives:');
  console.log(`  • At threshold >= 40: ${(benignFlaggedAt40 / totalBenign * 100).toFixed(2)}% (${benignFlaggedAt40} / ${totalBenign})`);
  console.log(`  • At threshold >= 50: ${(benignFlaggedAt50 / totalBenign * 100).toFixed(2)}% (${benignFlaggedAt50} / ${totalBenign})`);
  console.log('\nScam Recall:');
  console.log(`  • At threshold >= 40: ${(scamFlaggedAt40 / totalScam * 100).toFixed(2)}% (${scamFlaggedAt40} / ${totalScam})`);
  console.log(`  • At threshold >= 50: ${(scamFlaggedAt50 / totalScam * 100).toFixed(2)}% (${scamFlaggedAt50} / ${totalScam})`);

  console.log('\nCategory Breakdown (At Threshold >= 40):');
  for (const [cat, stat] of Object.entries(categoryStats)) {
    const rate = ((stat.flagged40 / stat.total) * 100).toFixed(1);
    const typeLabel = stat.label === 1 ? 'SCAM' : 'BENIGN';
    console.log(`  • [${typeLabel}] ${cat.padEnd(20)}: ${stat.flagged40}/${stat.total} flagged (${rate}%)`);
  }
}

main().catch(err => {
  console.error('[Eval Rules] Error:', err);
  process.exit(1);
});
