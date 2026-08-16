/**
 * Automated .exe Installer Creation Script for Overtone Music Player
 * 
 * Usage:
 *   node scripts/build-installer.js
 *   npm run build:installer
 * 
 * Steps performed:
 *   1. System & dependency checks
 *   2. Clean previous build artifacts (out/, dist/, release/)
 *   3. Build Next.js frontend (static HTML/CSS/JS export in out/)
 *   4. Build Electron main process & preload scripts (tsup bundle in dist/)
 *   5. Package Windows NSIS Installer (.exe) with electron-builder
 *   6. Verify installer artifact and output statistics
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI escape colors for clean terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function logHeader(stepNumber, totalSteps, title) {
  console.log(`\n${colors.cyan}${colors.bright}[${stepNumber}/${totalSteps}] ${title}${colors.reset}`);
  console.log(`${colors.dim}${'─'.repeat(60)}${colors.reset}`);
}

function logSuccess(msg) {
  console.log(`${colors.green}✔ ${msg}${colors.reset}`);
}

function logInfo(msg) {
  console.log(`${colors.blue}ℹ ${msg}${colors.reset}`);
}

function logWarn(msg) {
  console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`);
}

function logError(msg) {
  console.log(`${colors.red}✖ ${msg}${colors.reset}`);
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const rootDir = path.resolve(__dirname, '..');
const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
const appName = pkg.build?.productName || pkg.productName || 'Overtone';

const TOTAL_STEPS = 5;
const startTime = Date.now();

console.log(`${colors.magenta}${colors.bright}`);
console.log('╔══════════════════════════════════════════════════════════╗');
console.log(`║   ${appName.padEnd(12, ' ')} v${pkg.version} - Windows .EXE Installer Builder   ║`);
console.log('╚══════════════════════════════════════════════════════════╝');
console.log(`${colors.reset}`);

async function runCommand(command, args, description) {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === 'win32';
    // On Windows, command might need .cmd suffix when running npm / npx
    const fullCmd = isWindows && !command.endsWith('.cmd') && (command === 'npm' || command === 'npx')
      ? `${command}.cmd`
      : command;

    logInfo(`Running: ${fullCmd} ${args.join(' ')}`);

    const proc = spawn(fullCmd, args, {
      cwd: rootDir,
      stdio: 'inherit',
      shell: isWindows,
      env: { ...process.env, NODE_ENV: 'production' }
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${description} failed with exit code ${code}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to start command '${fullCmd}': ${err.message}`));
    });
  });
}

async function build() {
  try {
    // ── STEP 1: Check Environment ──
    logHeader(1, TOTAL_STEPS, 'Environment & Prerequisite Verification');
    logInfo(`Target Application: ${appName} (v${pkg.version})`);
    logInfo(`Node Runtime: ${process.version}`);
    logInfo(`Working Directory: ${rootDir}`);

    if (!fs.existsSync(path.join(rootDir, 'node_modules'))) {
      throw new Error('node_modules folder not found! Please run "npm install" first.');
    }
    logSuccess('Dependencies and environment verified.');

    // ── STEP 2: Clean Stale Artifacts ──
    logHeader(2, TOTAL_STEPS, 'Cleaning Previous Build Artifacts');
    const dirsToClean = [
      path.join(rootDir, 'out'),
      path.join(rootDir, 'dist'),
      path.join(rootDir, '.next')
    ];

    for (const dir of dirsToClean) {
      if (fs.existsSync(dir)) {
        logInfo(`Removing: ${path.relative(rootDir, dir)}`);
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
    logSuccess('Cleaned old build output folders.');

    // ── STEP 3: Build Next.js Static UI Export ──
    logHeader(3, TOTAL_STEPS, 'Building Next.js Static Export');
    await runCommand('npx', ['next', 'build'], 'Next.js Frontend Build');
    
    if (!fs.existsSync(path.join(rootDir, 'out', 'index.html'))) {
      throw new Error('Next.js static export failed: out/index.html not found!');
    }
    logSuccess('Next.js static frontend successfully generated in out/');

    // ── STEP 4: Bundle Electron Main & Preload ──
    logHeader(4, TOTAL_STEPS, 'Compiling Electron Main & Preload Scripts');
    await runCommand('npx', [
      'tsup', 
      'main/main.ts', 
      'main/preload.ts', 
      '--format', 'cjs', 
      '--external', 'electron', 
      '--external', 'better-sqlite3'
    ], 'Electron Process Compilation');

    if (!fs.existsSync(path.join(rootDir, 'dist', 'main.js')) || !fs.existsSync(path.join(rootDir, 'dist', 'preload.js'))) {
      throw new Error('Electron bundle failed: dist/main.js or dist/preload.js not found!');
    }
    logSuccess('Electron main & preload bundles generated in dist/');

    // ── STEP 5: Package Windows NSIS .exe Installer ──
    logHeader(5, TOTAL_STEPS, 'Packaging Windows NSIS .exe Installer via electron-builder');
    await runCommand('npx', ['electron-builder', '--win', 'nsis'], 'Electron Builder Packaging');

    // ── Completion & Output Analysis ──
    const releaseDir = path.join(rootDir, 'release');
    let installerFile = null;

    if (fs.existsSync(releaseDir)) {
      const files = fs.readdirSync(releaseDir);
      installerFile = files.find(f => f.endsWith('.exe') && !f.includes('uninstaller') && !f.includes('blockmap'));
    }

    const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\n${colors.green}${colors.bright}════════════════════════════════════════════════════════════`);
    console.log(`  🎉  BUILD COMPLETED SUCCESSFULLY IN ${elapsedSeconds}s!`);
    console.log(`════════════════════════════════════════════════════════════${colors.reset}\n`);

    if (installerFile) {
      const installerPath = path.join(releaseDir, installerFile);
      const stat = fs.statSync(installerPath);
      console.log(`${colors.bright}Installer Details:${colors.reset}`);
      console.log(`  • File Name:     ${colors.cyan}${installerFile}${colors.reset}`);
      console.log(`  • File Size:     ${colors.yellow}${formatBytes(stat.size)}${colors.reset}`);
      console.log(`  • Absolute Path: ${colors.green}${installerPath}${colors.reset}\n`);
      console.log(`${colors.bright}How to install and run:${colors.reset}`);
      console.log(`  1. Double-click ${colors.cyan}${installerFile}${colors.reset} to run the installer setup wizard.`);
      console.log(`  2. Choose installation folder (or accept default Program Files).`);
      console.log(`  3. The installer creates a Desktop Shortcut & Start Menu entry for Overtone.`);
      console.log(`  4. Launch Overtone and select your local music folders!\n`);
    } else {
      logWarn('Installer file not found in release/ folder. Check electron-builder output above.');
    }

  } catch (err) {
    console.error(`\n${colors.red}${colors.bright}════════════════════════════════════════════════════════════`);
    console.error(`  ❌  BUILD FAILED!`);
    console.error(`════════════════════════════════════════════════════════════${colors.reset}`);
    logError(err.message);
    process.exit(1);
  }
}

build();
