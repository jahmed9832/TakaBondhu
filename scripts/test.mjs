import fs from 'fs';
import path from 'path';
import { ROOT_DIR, BACKEND_DIR, ML_DIR, getVenvPython, execLive } from './utils.mjs';

async function runTests() {
  console.log('======================================================');
  console.log('🧪 TakaBondhu / ScamShield - Comprehensive Test Suite');
  console.log('======================================================\n');

  let failed = false;

  // 1. Run Node.js Tests
  console.log('🟢 [1/2] Running Node.js Test Suite (node:test)...');
  try {
    const testsDir = path.join(BACKEND_DIR, 'tests');
    const testFiles = fs.readdirSync(testsDir)
      .filter(f => f.endsWith('.test.js'))
      .map(f => path.join(testsDir, f));
    await execLive('node', ['--test', ...testFiles], { cwd: ROOT_DIR });
    console.log('✅ Node.js tests passed.\n');
  } catch (err) {
    console.error('❌ Node.js tests failed:\n', err.message);
    failed = true;
  }

  // 2. Run Python Pytest Suite
  console.log('🐍 [2/2] Running Python ML Test Suite (pytest)...');
  const venvPython = getVenvPython();
  if (venvPython) {
    try {
      await execLive(venvPython, ['-m', 'pytest', 'tests', '-v'], { cwd: ML_DIR });
      console.log('✅ Python tests passed.\n');
    } catch (err) {
      console.error('❌ Python tests failed:\n', err.message);
      failed = true;
    }
  } else {
    console.warn('⚠️ Python venv not found. Skipping pytest.\n');
  }

  if (failed) {
    console.error('======================================================');
    console.error('❌ Test suite failed!');
    console.error('======================================================');
    process.exit(1);
  } else {
    console.log('======================================================');
    console.log('🎉 All test suites passed successfully!');
    console.log('======================================================');
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
