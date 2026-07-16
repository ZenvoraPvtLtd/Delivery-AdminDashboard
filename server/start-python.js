import { spawn, execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getPythonCommand() {
  const commands = ['python', 'py', 'python3'];
  for (const cmd of commands) {
    try {
      execSync(`${cmd} --version`, { stdio: 'ignore' });
      return cmd;
    } catch (e) {
      // Continue searching
    }
  }
  return null;
}

const pyCmd = getPythonCommand();
if (!pyCmd) {
  console.error('\n❌ ERROR: Python is not installed or not found in your system PATH.');
  console.error('Please install Python (https://www.python.org/) and make sure to check the box "Add Python to PATH" during installation.');
  console.error('If you have already installed it, restart your terminal or PC for the path changes to take effect.\n');
  process.exit(1);
}

const scriptPath = path.join(__dirname, 'main.py');
console.log(`[Python Launcher] Using command: "${pyCmd}"`);
console.log(`[Python Launcher] Starting FastAPI backend: ${scriptPath}`);

const pythonProcess = spawn(pyCmd, [scriptPath], {
  stdio: 'inherit',
  shell: true
});

pythonProcess.on('close', (code) => {
  console.log(`[Python Launcher] Python process exited with code ${code}`);
  process.exit(code);
});

pythonProcess.on('error', (err) => {
  console.error('[Python Launcher] Failed to start Python process:', err.message);
  process.exit(1);
});
