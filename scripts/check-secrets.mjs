#!/usr/bin/env node
/**
 * scripts/check-secrets.mjs
 * Pre-commit style security check scanning repo files for exposed API keys,
 * private keys, and credential tokens. Fails build/doctor if found.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Directories and files to ignore during scan
const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.venv',
  'venv',
  'env',
  'dist',
  'dist-ssr',
  '__pycache__',
  '.pytest_cache',
  'coverage',
  '.system_generated'
]);

const IGNORED_FILES = new Set([
  '.env', // local only, gitignored
  '.env.example', // template with placeholders
  'package-lock.json'
]);

// Secret regex patterns to detect
const SECRET_PATTERNS = [
  { name: 'Google API Key (AIzaSy)', regex: /AIzaSy[A-Za-z0-9_-]{33}/g },
  { name: 'Supabase Service Role Key', regex: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g },
  { name: 'Generic LiveKit Secret', regex: /API[a-zA-Z0-9]{12,}:[a-zA-Z0-9_-]{24,}/g },
  { name: 'RSA / Private Key Block', regex: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g }
];

function scanDirectory(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        scanDirectory(path.join(dir, entry.name), fileList);
      }
    } else {
      if (!IGNORED_FILES.has(entry.name) && !entry.name.endsWith('.pyc') && !entry.name.endsWith('.joblib')) {
        fileList.push(path.join(dir, entry.name));
      }
    }
  }
  return fileList;
}

export function runSecretAudit() {
  const files = scanDirectory(ROOT_DIR);
  const violations = [];

  for (const filePath of files) {
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch {
      continue; // Binary files or unreadable
    }

    for (const pattern of SECRET_PATTERNS) {
      pattern.regex.lastIndex = 0;
      let match;
      while ((match = pattern.regex.exec(content)) !== null) {
        // Exclude dummy test matches or documented placeholders
        const matchedStr = match[0];
        if (
          matchedStr.includes('your-api-key') ||
          matchedStr.includes('placeholder') ||
          matchedStr.includes('sb_secret_...')
        ) {
          continue;
        }

        const relativePath = path.relative(ROOT_DIR, filePath);
        // Calculate line number
        const lineNo = content.substring(0, match.index).split('\n').length;
        violations.push({
          file: relativePath,
          line: lineNo,
          type: pattern.name,
          preview: matchedStr.substring(0, 8) + '...' + matchedStr.substring(matchedStr.length - 4)
        });
      }
    }
  }

  return violations;
}

// Direct execution
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  console.log('🔍 Scanning repository for accidental credentials or hardcoded keys...');
  const violations = runSecretAudit();

  if (violations.length > 0) {
    console.error('\n🚨 CRITICAL SECURITY ALERT: Hardcoded credentials detected in repository!');
    console.table(violations);
    console.error('\nPlease remove these secrets immediately or place them in backend/.env (which is gitignored).\n');
    process.exit(1);
  } else {
    console.log('✅ Clean: No exposed credentials or secret tokens found in tracked files.');
    process.exit(0);
  }
}
