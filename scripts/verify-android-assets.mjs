import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const host = 'wzhuzaccdwrzsibtzfng.supabase.co';
const stamp = `EXY_ANDROID_PRODUCTION:${host}`;
const releaseVersion = JSON.parse(readFileSync('package.json', 'utf8')).version;
const releaseMarker = `EXY_RELEASE_VERSION:${releaseVersion}`;
const directory = 'android/app/src/main/assets/public';
const buildInfoPath = join(directory, 'exy-build-info.json');

function contains(directory, text) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory() && contains(path, text)) return true;
    if (entry.isFile() && readFileSync(path, 'utf8').includes(text)) return true;
  }
  return false;
}

if (
  !existsSync(directory) ||
  !existsSync(buildInfoPath) ||
  !readFileSync(buildInfoPath, 'utf8').includes(releaseMarker) ||
  !readFileSync(buildInfoPath, 'utf8').includes(stamp) ||
  !contains(directory, host) ||
  !contains(directory, stamp) ||
  !contains(directory, releaseMarker) ||
  contains(directory, 'test.signature')
) {
  console.error(`EXY Android build blocked: Capacitor assets do not contain the verified production Supabase configuration and ${releaseMarker}.`);
  process.exit(1);
}

console.log(`EXY Android Capacitor assets verified: ${host} · version ${releaseVersion} · exy-build-info.json present`);
