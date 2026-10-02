import fs from 'fs';
import path from 'path';
import { ROOT_DIR, BACKEND_DIR, ML_DIR, getVenvPython, getSystemPython, isPortAvailable } from './utils.mjs';

// Parse backend/.env safely without external dependencies and NEVER printing values
const envPath = path.join(BACKEND_DIR, '.env');
const envConfig = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        envConfig[key] = val;
      }
    }
  }
}

async function runDoctor() {
  console.log('================================================================');
  console.log('🩺 TakaBondhu / ScamShield - System Health Doctor');
  console.log('================================================================\n');

  const results = [];

  function addResult(status, component, details) {
    results.push({ status, component, details });
  }

  // 1. Node.js Version
  const nodeVer = process.version;
  const major = parseInt(nodeVer.slice(1).split('.')[0], 10);
  if (major >= 18) {
    addResult('PASS', 'Node.js Runtime', `${nodeVer} (>= v18 supported)`);
  } else {
    addResult('WARN', 'Node.js Runtime', `${nodeVer} (Recommended: v18+)`);
  }

  // 2. Python & Virtual Environment
  const venvPy = getVenvPython();
  const sysPy = getSystemPython();
  if (venvPy) {
    addResult('PASS', 'Python Virtualenv', `ml/.venv configured (${venvPy})`);
  } else if (sysPy) {
    addResult('WARN', 'Python Virtualenv', `ml/.venv missing. Found system Python ${sysPy.version}. Run 'npm run setup'`);
  } else {
    addResult('WARN', 'Python Runtime', 'No Python 3 detected. App will run in deterministic rules-only mode');
  }

  // 3. Model Files
  const modelPath = path.join(ML_DIR, 'models', 'model.joblib');
  const metaPath = path.join(ML_DIR, 'models', 'metadata.json');
  if (fs.existsSync(modelPath) && fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      addResult('PASS', 'ML Model Artifacts', `${meta.model_name || 'TF-IDF+LR'} (v${meta.model_version || '1.0.0'}, T=${meta.threshold})`);
    } catch {
      addResult('PASS', 'ML Model Artifacts', 'ml/models/model.joblib present');
    }
  } else {
    addResult('WARN', 'ML Model Artifacts', 'Model artifact missing. Run `npm run train` or `npm run setup`');
  }

  // 4. ML Service Health (if port 8001 running)
  try {
    const res = await fetch('http://127.0.0.1:8001/health', { signal: AbortSignal.timeout(1000) });
    if (res.ok) {
      const data = await res.json();
      addResult('PASS', 'ML Service (8001)', `Active (Model: ${data.model_version}, Threshold: ${data.threshold})`);
    } else {
      addResult('WARN', 'ML Service (8001)', `Returned HTTP ${res.status}`);
    }
  } catch {
    addResult('INFO', 'ML Service (8001)', 'Not running right now (will start automatically with `npm run dev`)');
  }

  // 5. Environment Variables Set (NAMES ONLY, NEVER VALUES)
  const isDemoOffline = envConfig.DEMO_OFFLINE === 'true' || process.env.DEMO_OFFLINE === 'true';
  const envKeys = ['GEMINI_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'LIVEKIT_URL', 'LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET'];
  const configuredKeys = envKeys.filter(k => Boolean(envConfig[k] || process.env[k]));
  const missingKeys = envKeys.filter(k => !Boolean(envConfig[k] || process.env[k]));

  addResult(
    configuredKeys.length > 0 ? 'PASS' : 'INFO',
    'Configured API Keys',
    configuredKeys.length > 0 ? configuredKeys.join(', ') : 'None set (running 100% offline fallback mode)'
  );

  if (missingKeys.length > 0 && !isDemoOffline) {
    addResult('INFO', 'Unset API Keys', missingKeys.join(', ') + ' (features gracefully degrade)');
  }

  // 6. Supabase Reachability (skipped in DEMO_OFFLINE)
  if (isDemoOffline) {
    addResult('PASS', 'Supabase RAG', 'Skipped (DEMO_OFFLINE=true)');
  } else {
    const sUrl = envConfig.SUPABASE_URL || process.env.SUPABASE_URL;
    if (sUrl) {
      try {
        const ping = await fetch(sUrl, { signal: AbortSignal.timeout(3000) });
        addResult('PASS', 'Supabase Endpoint', `Reachable (HTTP ${ping.status})`);
      } catch (err) {
        addResult('WARN', 'Supabase Endpoint', `Unreachable: ${err.message}`);
      }
    } else {
      addResult('INFO', 'Supabase Endpoint', 'Not configured; offline mock/curated rules active');
    }
  }

  // 7. Port Availability Check
  const portsToCheck = [
    { port: 5000, name: 'Backend API' },
    { port: 5173, name: 'Frontend (Vite)' },
    { port: 8001, name: 'ML Service' }
  ];

  for (const { port, name } of portsToCheck) {
    const avail = await isPortAvailable(port);
    if (avail) {
      addResult('PASS', `Port :${port}`, `${name} port is free`);
    } else {
      addResult('WARN', `Port :${port}`, `${name} port is IN USE or service already running`);
    }
  }

  // Print Formatted Report Table
  console.log('| Status | Component            | Details');
  console.log('|:-------|:---------------------|:-------------------------------------------------------');
  for (const r of results) {
    const statusTag = r.status === 'PASS' ? '✅ PASS' : r.status === 'WARN' ? '⚠️  WARN' : 'ℹ️  INFO';
    const compPadded = r.component.padEnd(20, ' ');
    console.log(`| ${statusTag.padEnd(6, ' ')} | ${compPadded} | ${r.details}`);
  }
  console.log('----------------------------------------------------------------\n');
}

runDoctor().catch((err) => {
  console.error('Doctor check failed:', err);
  process.exit(1);
});
