import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

console.log('🚀 Starting Delivery Admin Dashboard...');
console.log('📦 Starting Frontend (Vite) and Backend (FastAPI) concurrently...');

// Start backend
const backend = spawn('npm', ['run', 'server'], {
  stdio: 'inherit',
  shell: true,
  cwd: projectRoot
});

// Start frontend
const frontend = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: projectRoot
});

backend.on('close', (code) => {
  console.log(`[System] Backend process exited with code ${code}`);
  frontend.kill();
  process.exit(code);
});

frontend.on('close', (code) => {
  console.log(`[System] Frontend process exited with code ${code}`);
  backend.kill();
  process.exit(code);
});
