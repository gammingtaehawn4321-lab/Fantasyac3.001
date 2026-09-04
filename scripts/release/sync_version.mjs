import fs from 'node:fs';
import path from 'node:path';

const version = process.argv[2];
const buildNumberRaw = process.argv[3];
if (!version) {
  console.error('usage: node scripts/release/sync_version.mjs <version> [buildNumber]');
  process.exit(2);
}
const clean = version.replace(/^v/, '');
const numeric = clean.match(/^(\d+)\.(\d+)\.(\d+)/);
if (!numeric) throw new Error(`invalid version: ${version}`);
const buildNumber = Number(buildNumberRaw || `${numeric[1]}${numeric[2].padStart(2,'0')}${numeric[3].padStart(2,'0')}`);
if (!Number.isInteger(buildNumber) || buildNumber <= 0) throw new Error('invalid build number');

const pkgPath = 'package.json';
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.version = clean;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

fs.writeFileSync('src/runtime/version.ts', `export const FANTASYAC_APP_VERSION = '${clean}';\n`);

const gradlePath = 'native/android/app/build.gradle.kts';
let gradle = fs.readFileSync(gradlePath, 'utf8');
gradle = gradle.replace(/versionCode\s*=\s*\d+/, `versionCode = ${buildNumber}`)
               .replace(/versionName\s*=\s*"[^"]+"/, `versionName = "${clean}"`);
fs.writeFileSync(gradlePath, gradle);

const iosPath = 'native/ios/project.yml';
let ios = fs.readFileSync(iosPath, 'utf8');
ios = ios.replace(/MARKETING_VERSION:\s*[^\n]+/, `MARKETING_VERSION: ${clean.match(/^\d+\.\d+\.\d+/)?.[0] || clean}`)
         .replace(/CURRENT_PROJECT_VERSION:\s*\d+/, `CURRENT_PROJECT_VERSION: ${buildNumber}`);
fs.writeFileSync(iosPath, ios);

console.log(JSON.stringify({version: clean, buildNumber}));
