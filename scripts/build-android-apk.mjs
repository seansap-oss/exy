import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const root = process.cwd();
const version = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).version;

// This is the only supported APK command. It rebuilds the web bundle from the
// production Supabase variables before Gradle runs, so stale Capacitor assets
// can never be packaged by mistake.
run(process.execPath, ['scripts/build-android-production.mjs'], root);
run(process.platform === 'win32' ? 'gradlew.bat' : './gradlew', ['clean', 'assembleDebug'], resolve(root, 'android'));

const apk = resolve(root, 'android/app/build/outputs/apk/debug/app-debug.apk');
if (!existsSync(apk)) throw new Error('APK build reported success, but app-debug.apk was not produced.');

const releaseDir = resolve(root, 'release');
mkdirSync(releaseDir, { recursive: true });
const output = resolve(releaseDir, `EXY-v${version}-production.apk`);
copyFileSync(apk, output);
console.log(`EXY production APK ready: ${output}`);
