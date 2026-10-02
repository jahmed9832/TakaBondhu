import fs from 'fs';
import path from 'path';
import { ROOT_DIR, BACKEND_DIR, FRONTEND_DIR, ML_DIR, getVenvPython, getSystemPython, execLive } from './utils.mjs';

async function setup() {
  console.log('======================================================');
  console.log('🚀 TakaBondhu / ScamShield - Cross-Platform Setup');
  console.log('======================================================\n');

  // 1. Install Node Dependencies
  console.log('📦 [1/5] Installing Node dependencies (root, backend, frontend)...');
  await execLive('npm', ['install'], { cwd: ROOT_DIR });
  await execLive('npm', ['install'], { cwd: BACKEND_DIR });
  await execLive('npm', ['install'], { cwd: FRONTEND_DIR });
  console.log('✅ Node dependencies installed.\n');

  // 2. Setup Python Virtual Environment
  console.log('🐍 [2/5] Checking Python environment...');
  let venvPython = getVenvPython();

  if (!venvPython) {
    const sysPy = getSystemPython();
    if (!sysPy) {
      console.warn('⚠️ No Python 3 found on system! Python is required for ML service.');
      console.warn('   The application can still run in rules-only mode.\n');
    } else {
      console.log(`Found system Python: ${sysPy.version} via '${sysPy.cmd}'`);
      console.log('Creating virtualenv in ml/.venv...');
      const venvArgs = [...sysPy.args, '-m', 'venv', path.join(ML_DIR, '.venv')];
      await execLive(sysPy.cmd, venvArgs, { cwd: ML_DIR });
      venvPython = getVenvPython();
      console.log('✅ Created ml/.venv\n');
    }
  } else {
    console.log(`✅ Existing virtualenv found: ${venvPython}\n`);
  }

  // 3. Install Python Dependencies
  if (venvPython) {
    console.log('📥 [3/5] Installing Python dependencies from ml/requirements.txt...');
    const reqFile = path.join(ML_DIR, 'requirements.txt');
    if (fs.existsSync(reqFile)) {
      await execLive(venvPython, ['-m', 'pip', 'install', '--upgrade', 'pip'], { cwd: ML_DIR });
      await execLive(venvPython, ['-m', 'pip', 'install', '-r', reqFile], { cwd: ML_DIR });
      console.log('✅ Python dependencies installed.\n');
    }
  }

  // 4. Copy backend/.env.example to backend/.env if missing (NEVER overwrite)
  console.log('⚙️ [4/5] Checking environment configuration...');
  const envExample = path.join(BACKEND_DIR, '.env.example');
  const envFile = path.join(BACKEND_DIR, '.env');

  if (!fs.existsSync(envFile)) {
    if (fs.existsSync(envExample)) {
      fs.copyFileSync(envExample, envFile);
      console.log('✅ Copied backend/.env.example -> backend/.env');
    } else {
      console.warn('⚠️ backend/.env.example not found!');
    }
  } else {
    console.log('✅ backend/.env already exists (preserved untouched).');
  }

  // 5. Check ML Model files (train only if missing)
  console.log('\n🤖 [5/5] Checking ML model artifacts...');
  const modelFile = path.join(ML_DIR, 'models', 'model.joblib');
  if (!fs.existsSync(modelFile)) {
    console.log('ML model not found. Training model now (npm run train)...');
    if (venvPython) {
      await execLive('node', [path.join(ROOT_DIR, 'scripts', 'train.mjs')]);
    } else {
      console.warn('⚠️ Skipping training because Python venv is not ready.');
    }
  } else {
    console.log('✅ Pre-trained model artifact present (ml/models/model.joblib). Retraining skipped.');
  }

  // Required API Keys summary
  console.log('\n======================================================');
  console.log('🔑 API KEY CONFIGURATION STATUS');
  console.log('======================================================');
  console.log('ScamShield runs 100% LOCALLY without any cloud API keys:');
  console.log('  - Rule Engine + ML Model: Fully offline');
  console.log('  - DEMO_OFFLINE=true allows complete offline execution');
  console.log('\nOptional external services (configure in backend/.env if desired):');
  console.log('  • GEMINI_API_KEY      - For conversational LLM explanations');
  console.log('  • SUPABASE_URL & KEY  - For pgvector knowledge base RAG');
  console.log('  • LIVEKIT_*           - For realtime interactive Bangla voice assistant');
  console.log('\nSetup completed successfully! Run `npm run doctor` to verify environment.');
  console.log('======================================================\n');
}

setup().catch((err) => {
  console.error('\n❌ Setup failed:', err.message);
  process.exit(1);
});
