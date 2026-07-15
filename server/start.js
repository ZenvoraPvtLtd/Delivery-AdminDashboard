import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverScript = path.join(__dirname, 'index.js');

console.log('[Backend Starter] Starting Node.js Express server...');
console.log(`[Backend Starter] Running script: ${serverScript}`);

const nodeProcess = spawn('node', [serverScript], {
  stdio: 'inherit',
  shell: true
});

nodeProcess.on('close', (code) => {
  console.log(`[Backend Starter] Node process exited with code ${code}`);
  process.exit(code);
});

nodeProcess.on('error', (err) => {
  console.error('[Backend Starter] Failed to start Node process:', err.message);
  process.exit(1);
});
