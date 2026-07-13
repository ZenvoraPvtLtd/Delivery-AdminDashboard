import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pythonPaths = [
  'C:\\Users\\pc\\AppData\\Local\\Programs\\Python\\Python312\\python.exe',
  'C:\\Users\\pc\\AppData\\Local\\Programs\\Python\\Python310\\python.exe',
  'python',
  'python3',
  'py'
];

function findPython() {
  for (const p of pythonPaths) {
    try {
      if (p.includes('\\') && fs.existsSync(p)) {
        return p;
      }
    } catch (e) {}
  }
  // Fallback to system command path
  return 'python';
}

const pythonExe = findPython();
const serverScript = path.join(__dirname, 'main.py');

console.log(`[Backend Starter] Using Python: ${pythonExe}`);
console.log(`[Backend Starter] Starting FastAPI server from: ${serverScript}`);

const pyProcess = spawn(pythonExe, [serverScript], {
  stdio: 'inherit',
  shell: true
});

pyProcess.on('close', (code) => {
  console.log(`[Backend Starter] Python process exited with code ${code}`);
  process.exit(code);
});

pyProcess.on('error', (err) => {
  console.error('[Backend Starter] Failed to start Python process:', err.message);
  console.error('[Backend Starter] Please ensure Python 3 is installed and in your environment PATH.');
  process.exit(1);
});
