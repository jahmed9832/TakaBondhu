import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { ROOT_DIR, BACKEND_DIR, FRONTEND_DIR, ML_DIR, getVenvPython } from './utils.mjs';

const children = [];

function killAll() {
  console.log('\n🛑 Shutting down ScamShield dev services...');
  for (const child of children) {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', child.pid.toString(), '/f', '/t']);
      } else {
        child.kill('SIGTERM');
      }
    } catch {
      // Ignore
    }
  }
}

process.on('SIGINT', () => {
  killAll();
  process.exit(0);
});

process.on('SIGTERM', () => {
  killAll();
  process.exit(0);
});

async function waitForHealth(url, timeoutMs = 6000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(600) });
      if (res.ok) return true;
    } catch {
      // retry
    }
    await new Promise(r => setTimeout(r, 400));
  }
  return false;
}

async function dev() {
  console.log('======================================================');
  console.log('⚡ TakaBondhu / ScamShield - Local Dev Orchestrator');
  console.log('======================================================\n');

  const venvPython = getVenvPython();
  const modelExists = fs.existsSync(path.join(ML_DIR, 'models', 'model.joblib'));

  // 1. ML Service
  if (venvPython && modelExists) {
    console.log('🤖 [1/3] Starting Local ML Microservice (FastAPI :8001)...');
    const mlProc = spawn(venvPython, ['-m', 'uvicorn', 'service:app', '--host', '127.0.0.1', '--port', '8001'], {
      cwd: ML_DIR,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    children.push(mlProc);

    mlProc.stdout.on('data', (d) => {
      const line = d.toString().trim();
      if (line) console.log(`\x1b[36m[ML]\x1b[0m ${line}`);
    });
    mlProc.stderr.on('data', (d) => {
      const line = d.toString().trim();
      if (line) console.error(`\x1b[36m[ML]\x1b[0m ${line}`);
    });

    const mlReady = await waitForHealth('http://127.0.0.1:8001/health', 8000);
    if (mlReady) {
      console.log('✅ ML service active and healthy on http://127.0.0.1:8001\n');
    } else {
      console.warn('⚠️ ML service started but did not respond to /health in time. Continuing.\n');
    }
  } else {
    console.log('\x1b[33m======================================================');
    console.log('⚠️  NOTICE: ML service disabled (venv or model missing)');
    console.log('   The application will run in deterministic rules-only mode.');
    console.log('   To enable local ML, run: npm run setup && npm run train');
    console.log('======================================================\x1b[0m\n');
  }

  // 2. Backend Service
  console.log('⚙️ [2/3] Starting Express Backend API (:5000)...');
  const backendProc = spawn('node', ['server.js'], {
    cwd: BACKEND_DIR,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  children.push(backendProc);

  backendProc.stdout.on('data', (d) => {
    const line = d.toString().trim();
    if (line) console.log(`\x1b[32m[BACKEND]\x1b[0m ${line}`);
  });
  backendProc.stderr.on('data', (d) => {
    const line = d.toString().trim();
    if (line) console.error(`\x1b[32m[BACKEND]\x1b[0m ${line}`);
  });

  // 3. Frontend Service
  console.log('🎨 [3/3] Starting React + Vite Frontend (:5173)...');
  const viteBin = path.join(FRONTEND_DIR, 'node_modules', 'vite', 'bin', 'vite.js');
  let frontendProc;
  if (fs.existsSync(viteBin)) {
    frontendProc = spawn('node', [viteBin], {
      cwd: FRONTEND_DIR,
      stdio: ['ignore', 'pipe', 'pipe']
    });
  } else {
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    frontendProc = spawn(npmCmd, ['run', 'dev'], {
      cwd: FRONTEND_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32'
    });
  }
  children.push(frontendProc);

  frontendProc.stdout.on('data', (d) => {
    const line = d.toString().trim();
    if (line) console.log(`\x1b[35m[FRONTEND]\x1b[0m ${line}`);
  });
  frontendProc.stderr.on('data', (d) => {
    const line = d.toString().trim();
    if (line) console.error(`\x1b[35m[FRONTEND]\x1b[0m ${line}`);
  });

  console.log('\n======================================================');
  console.log('🎉 TakaBondhu is running locally:');
  console.log('   • Frontend Web App: http://localhost:5173');
  console.log('   • Backend API:      http://localhost:5000');
  console.log('   • ML Microservice:  http://localhost:8001');
  console.log('Press Ctrl+C to stop all services.');
  console.log('======================================================\n');
}

dev().catch((err) => {
  console.error('Failed to start dev orchestrator:', err);
  killAll();
  process.exit(1);
});
