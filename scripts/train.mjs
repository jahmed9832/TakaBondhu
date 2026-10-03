import path from 'path';
import { ROOT_DIR, ML_DIR, getVenvPython, execLive } from './utils.mjs';

async function train() {
  console.log('======================================================');
  console.log('🧠 TakaBondhu - End-to-End ML Pipeline');
  console.log('======================================================\n');

  const pythonExe = getVenvPython();
  if (!pythonExe) {
    console.error('❌ Virtual environment Python not found in ml/.venv.');
    console.error('   Please run `npm run setup` first.');
    process.exit(1);
  }

  // 1. Generate Synthetic Message Dataset
  console.log('📊 [1/6] Generating synthetic message dataset (ml/generate_dataset.py)...');
  await execLive(pythonExe, [path.join(ML_DIR, 'generate_dataset.py')], { cwd: ML_DIR });

  // 2. Rules Export
  console.log('\n📐 [2/6] Scoring dataset with rule engine (ml/eval_rules.mjs)...');
  await execLive('node', [path.join(ML_DIR, 'eval_rules.mjs')], { cwd: ML_DIR });

  // 3. Train Message Model
  console.log('\n🏋️ [3/6] Training TF-IDF + Logistic Regression model (ml/train.py)...');
  await execLive(pythonExe, [path.join(ML_DIR, 'train.py')], { cwd: ML_DIR });

  // 4. Train Transaction Risk Model & Graph Topology Cache
  console.log('\n🌲 [4/6] Training LightGBM transaction model & graph analysis (ml/transactions/train_transaction_model.py)...');
  await execLive(pythonExe, [path.join(ML_DIR, 'transactions', 'train_transaction_model.py')], { cwd: ROOT_DIR });

  // 5. Evaluate Multi-Signal Models, Fairness, & Robustness
  console.log('\n📈 [5/6] Evaluating models, fairness, and robustness (ml/eval.py)...');
  await execLive(pythonExe, [path.join(ML_DIR, 'eval.py')], { cwd: ROOT_DIR });

  // 6. Simulate Business Impact, Synchronize Checklist & Export Figures
  console.log('\n💼 [6/6] Computing business impact, synchronizing checklist, and exporting figures...');
  await execLive(pythonExe, [path.join(ROOT_DIR, 'impact', 'simulator.py')], { cwd: ROOT_DIR });
  await execLive('node', [path.join(ROOT_DIR, 'scripts', 'update-checklist.mjs')], { cwd: ROOT_DIR });
  await execLive(pythonExe, [path.join(ROOT_DIR, 'scripts', 'export_figures.py')], { cwd: ROOT_DIR });

  console.log('\n======================================================');
  console.log('✅ End-to-end training & evaluation pipeline completed successfully!');
  console.log('   All artifacts, benchmarks, checklists, and figures regenerated from code.');
  console.log('======================================================\n');
}

train().catch((err) => {
  console.error('\n❌ Training failed:', err.message);
  process.exit(1);
});
