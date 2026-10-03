import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, spawnSync } from 'child_process';
import net from 'net';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ROOT_DIR = path.resolve(__dirname, '..');
export const ML_DIR = path.join(ROOT_DIR, 'ml');
export const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
export const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');

/**
 * Returns the platform-specific virtualenv python executable path.
 */
export function getVenvPython() {
  const isWindows = process.platform === 'win32';
  const venvPythonWin = path.join(ML_DIR, '.venv', 'Scripts', 'python.exe');
  const venvPythonPosix = path.join(ML_DIR, '.venv', 'bin', 'python');

  if (isWindows && fs.existsSync(venvPythonWin)) {
    return venvPythonWin;
  }
  if (!isWindows && fs.existsSync(venvPythonPosix)) {
    return venvPythonPosix;
  }
  return null;
}

/**
 * Discovers a working system python executable ('py -3', 'python', 'python3').
 */
export function getSystemPython() {
  const candidates = process.platform === 'win32'
    ? [['py', ['-3']], ['python', []], ['python3', []]]
    : [['python3', []], ['python', []]];

  for (const [cmd, args] of candidates) {
    try {
      const res = spawnSync(cmd, [...args, '--version'], { encoding: 'utf8', timeout: 3000 });
      if (res.status === 0 && res.stdout) {
        return { cmd, args, version: res.stdout.trim() };
      }
    } catch {
      // Continue to next candidate
    }
  }
  return null;
}

/**
 * Checks if a port is currently available.
 * @param {number} port
 * @returns {Promise<boolean>}
 */
export function isPortAvailable(port) {
  return new Promise((resolve) => {
    const client = net.createConnection({ port, host: '127.0.0.1' });
    client.setTimeout(400);
    client.on('connect', () => {
      client.destroy();
      resolve(false); // Connected means port is IN USE
    });
    client.on('timeout', () => {
      client.destroy();
      resolve(true); // Timed out means port is free
    });
    client.on('error', () => {
      resolve(true); // Connection refused means port is free
    });
  });
}

/**
 * Executes a command and streams output to terminal.
 */
export function execLive(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === 'win32';
    let resolvedCmd = cmd;
    let useShell = options.shell !== undefined ? options.shell : false;
    if (isWindows && (cmd === 'npm' || cmd === 'npx' || cmd.endsWith('.cmd') || cmd.endsWith('.bat'))) {
      resolvedCmd = cmd.endsWith('.cmd') || cmd.endsWith('.bat') ? cmd : `${cmd}.cmd`;
      useShell = true;
    }
    const child = spawn(resolvedCmd, args, {
      stdio: 'inherit',
      ...options,
      shell: useShell
    });
    child.on('close', (code) => {
      if (code === 0) resolve(code);
      else reject(new Error(`Command failed with exit code ${code}: ${cmd} ${args.join(' ')}`));
    });
    child.on('error', reject);
  });
}
