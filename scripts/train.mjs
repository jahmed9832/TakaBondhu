import path from 'path';
import { ROOT_DIR, ML_DIR, getVenvPython, execLive } from './utils.mjs';

async function train() {
  console.log('======================================================');
  console.log('🧠 TakaBondhu / ScamShield - End-to-End ML Pipeline');
  console.log('======================================================\n');

  const pythonExe = getVenvPython();
  if (!pythonExe) {
    console.error('❌ Virtual environment Python not found in ml/.venv.');
    console.error('   Please run `npm run setup` first.');
    process.exit(1);
  }

  // 1. Generate Synthetic Dataset
  console.log('📊 [1/4] Generating synthetic dataset (ml/generate_dataset.py)...');
  await execLive(pythonExe, [path.join(ML_DIR, 'generate_dataset.py')], { cwd: ML_DIR });

  // 2. Rules Export
  console.log('\n📐 [2/4] Scoring dataset with rule engine (ml/eval_rules.mjs)...');
  await execLive('node', [path.join(ML_DIR, 'eval_rules.mjs')], { cwd: ML_DIR });

  // 3. Train Model
  console.log('\n🏋️ [3/4] Training TF-IDF + Logistic Regression model (ml/train.py)...');
  await execLive(pythonExe, [path.join(ML_DIR, 'train.py')], { cwd: ML_DIR });

  // 4. Evaluate Model
  console.log('\n📈 [4/4] Evaluating models, fairness, and robustness (ml/eval.py)...');
  await execLive(pythonExe, [path.join(ML_DIR, 'eval.py')], { cwd: ML_DIR });

  console.log('\n======================================================');
  console.log('✅ Training & evaluation pipeline completed successfully!');
  console.log('   Artifacts generated in ml/models/ and ml/reports/');
  console.log('======================================================\n');
}

train().catch((err) => {
  console.error('\n❌ Training failed:', err.message);
  process.exit(1);
});
