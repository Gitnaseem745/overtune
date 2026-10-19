#!/usr/bin/env node
/**
 * Automated Standalone Android APK Build Script for Overtone Music Player
 * 
 * Usage:
 *   node scripts/build-apk.js
 *   npm run build:apk
 * 
 * Steps:
 *   1. Environment checks (Node.js, Java JDK 17+, Android SDK)
 *   2. Run Quality Gate (TypeScript typecheck & Jest tests)
 *   3. Generate native Android project via Expo Prebuild
 *   4. Compile Standalone Release APK using Gradle
 *   5. Package and verify Overtone.apk
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function logHeader(step, total, title) {
  console.log(`\n${colors.cyan}${colors.bright}[${step}/${total}] ${title}${colors.reset}`);
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

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const mobileDir = path.resolve(__dirname, '..');
const androidDir = path.join(mobileDir, 'android');
const totalSteps = 5;

console.log(`${colors.bright}${colors.cyan}====================================================${colors.reset}`);
console.log(`${colors.bright}🤖 Overtone — Standalone Android APK Generator${colors.reset}`);
console.log(`${colors.bright}${colors.cyan}====================================================${colors.reset}`);

// Step 1: Environment Check
logHeader(1, totalSteps, 'Verifying Build Environment');
try {
  const javaCheck = spawnSync('java', ['-version'], { encoding: 'utf-8' });
  if (javaCheck.status !== 0 && !javaCheck.stderr) {
    throw new Error('Java Runtime not detected');
  }
  const javaVer = (javaCheck.stderr || javaCheck.stdout || '').split('\n')[0];
  logSuccess(`Java runtime detected: ${javaVer.trim()}`);
} catch (err) {
  logError('Java Development Kit (JDK 17+) is required to compile native Android APKs.');
  logInfo('Install OpenJDK 17 (e.g., brew install openjdk@17 or from https://adoptium.net).');
  logInfo('Note: In CI/CD (GitHub Actions), JDK 17 is configured automatically.');
  process.exit(1);
}

const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
if (androidHome && fs.existsSync(androidHome)) {
  logSuccess(`Android SDK detected: ${androidHome}`);
} else {
  logWarn('ANDROID_HOME environment variable not set. Gradle will attempt to use standard paths.');
}

// Step 2: Quality Gate
logHeader(2, totalSteps, 'Running Quality Gate (Typecheck & Unit Tests)');
try {
  logInfo('Running TypeScript typecheck...');
  execSync('npm run typecheck', { cwd: mobileDir, stdio: 'inherit' });
  logSuccess('TypeScript checks passed.');

  logInfo('Running Jest unit tests...');
  execSync('npm test', { cwd: mobileDir, stdio: 'inherit' });
  logSuccess('All unit tests passed.');
} catch (err) {
  logError('Quality gate failed! Fix type errors or broken tests before building.');
  process.exit(1);
}

// Step 3: Expo Prebuild
logHeader(3, totalSteps, 'Generating Native Android Project (Expo Prebuild)');
try {
  execSync('npx expo prebuild --platform android --clean', { cwd: mobileDir, stdio: 'inherit' });
  logSuccess('Expo Android native project generated.');
} catch (err) {
  logError(`Expo prebuild failed: ${err.message}`);
  process.exit(1);
}

// Step 4: Gradle Build
logHeader(4, totalSteps, 'Compiling Standalone Android APK (Gradle assembleRelease)');
try {
  const isWindows = process.platform === 'win32';
  const gradlewCmd = isWindows ? 'gradlew.bat' : './gradlew';
  
  if (!isWindows) {
    const gradlewPath = path.join(androidDir, 'gradlew');
    fs.chmodSync(gradlewPath, '755');
  }

  logInfo(`Executing ${gradlewCmd} assembleRelease in android/...`);
  execSync(`${gradlewCmd} assembleRelease`, { cwd: androidDir, stdio: 'inherit' });
  logSuccess('Gradle compilation completed successfully.');
} catch (err) {
  logError(`Gradle build failed: ${err.message}`);
  process.exit(1);
}

// Step 5: Packaging Artifact
logHeader(5, totalSteps, 'Verifying & Packaging Overtone.apk');
function findApk(dir) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      const found = findApk(fullPath);
      if (found) return found;
    } else if (file.endsWith('.apk') && file.includes('release')) {
      return fullPath;
    }
  }
  return null;
}

const apkOutputBase = path.join(androidDir, 'app', 'build', 'outputs', 'apk');
let apkPath = findApk(apkOutputBase);

if (!apkPath) {
  // Fallback to any apk
  function findAnyApk(dir) {
    if (!fs.existsSync(dir)) return null;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        const found = findAnyApk(fullPath);
        if (found) return found;
      } else if (file.endsWith('.apk')) {
        return fullPath;
      }
    }
    return null;
  }
  apkPath = findAnyApk(apkOutputBase);
}

if (!apkPath) {
  logError(`No .apk found in ${apkOutputBase}`);
  process.exit(1);
}

const targetApk = path.join(mobileDir, 'Overtone.apk');
fs.copyFileSync(apkPath, targetApk);
const stats = fs.statSync(targetApk);

logSuccess(`Created standalone APK: ${targetApk}`);
logInfo(`File size: ${formatBytes(stats.size)}`);
console.log(`\n${colors.bright}${colors.green}🎉 Android Standalone APK build complete!${colors.reset}`);
console.log(`You can install this APK on any Android phone directly (sideloading).\n`);
