#!/usr/bin/env node
/**
 * scripts/export-clean.mjs
 * Creates a clean release zip archive of TakaBondhu excluding sensitive
 * credentials (.env), heavy dependencies (node_modules, .venv), caches, and git history.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ROOT_DIR, getVenvPython, getSystemPython } from './utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const exportZipName = 'takabondhu-clean-export.zip';
const exportZipPath = path.join(ROOT_DIR, exportZipName);

console.log('📦 TakaBondhu - Creating Clean Distribution Archive...');
console.log(`Target: ${exportZipPath}`);

// We use Python's built-in zipfile module for guaranteed cross-platform reproducibility
const pythonExec = getVenvPython() || getSystemPython()?.path || 'python';

const pythonScript = `
import os
import zipfile
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

root_dir = r"${ROOT_DIR.replace(/\\/g, '\\\\')}"
output_zip = r"${exportZipPath.replace(/\\/g, '\\\\')}"

exclude_dirs = {
    'node_modules', '.venv', 'venv', 'env', '.git',
    '__pycache__', '.pytest_cache', 'dist', 'dist-ssr',
    '.system_generated'
}

exclude_files = {
    '.env', '.env.local', '.env.production',
    'takabondhu-clean-export.zip'
}

print(f"Scanning from: {root_dir}")
file_count = 0

with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(root_dir):
        # Prune excluded directories in-place
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        for file in files:
            if file in exclude_files:
                continue
            if file.endswith('.pyc') or file.endswith('.log'):
                continue
            if file.startswith('.env.') and not file.endswith('.example'):
                continue
                
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, root_dir)
            zf.write(full_path, arcname=os.path.join('takabondhu', rel_path))
            file_count += 1

print(f"✅ Clean export created successfully with {file_count} files.")
print(f"Archive size: {os.path.getsize(output_zip) / (1024*1024):.2f} MB")
`;

const res = spawnSync(pythonExec, ['-c', pythonScript], {
  stdio: 'inherit',
  env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
});

if (res.status === 0) {
  console.log(`\n🎉 Ready: ${exportZipName} generated without secrets or heavy dependencies.`);
} else {
  console.error('\n❌ Export failed.');
  process.exit(1);
}
