import fs from 'node:fs';
const required = [
  'src/runtime/version.ts',
  'src/runtime/gameVersion.ts',
  'src/platform/gameContentUpdate.ts',
  'src/platform/updateBackup.ts',
  'native/android/app/src/main/java/com/fantasyac/game/GameContentManager.kt',
  'native/ios/Fantasyac/Runtime/GameContentManager.swift',
  'scripts/release/package_game_bundle.sh',
  'scripts/release/audit_game_patch_zip.mjs',
  'scripts/release/stamp_release_channel.mjs',
  '.github/workflows/game-patch.yml',
  '.github/workflows/unpack.yml',
  '.github/workflows/release.yml',
  '.github/workflows/validate.yml',
  'native/windows/FantasyacLauncher.ps1',
  'native/windows/ApplyUpdate.ps1',
  'native/android/app/build.gradle.kts',
  'native/android/app/src/main/cpp/CMakeLists.txt',
  'native/ios/project.yml',
  'src/user_content/petReferences.ts',
  'src/data/world/shops/shopTypes.ts',
  'src/data/world/shops/shopCatalog.ts',
  'src/data/world/shops/shopEngine.ts',
];
let failed = false;
for (const p of required) {
  if (!fs.existsSync(p)) { console.error('missing:', p); failed = true; }
}
const cmake = fs.readFileSync('native/android/app/src/main/cpp/CMakeLists.txt','utf8');
if (!cmake.includes('../../../../../third_party/llama.cpp')) {
  console.error('Android llama.cpp path is not pinned to native/third_party.'); failed = true;
}
const unpack = fs.readFileSync('.github/workflows/unpack.yml','utf8');
if (/--delete(?:-delay)?\b/.test(unpack)) {
  console.error('Unpack workflow must overlay partial ZIP patches; destructive rsync --delete is forbidden.'); failed = true;
}
if (!unpack.includes('git diff-tree') || !unpack.includes('Expected exactly one patch ZIP')) {
  console.error('Unpack workflow must resolve the ZIP from the triggering upload rather than filesystem mtime.'); failed = true;
}
if (!unpack.includes("--exclude='.github/workflows/'")) {
  console.error('Unpack workflow must never rewrite GitHub workflow files from a patch ZIP.'); failed = true;
}
if (!unpack.includes("--exclude='src/user_content/'") || !unpack.includes('--ignore-existing')) {
  console.error('Unpack workflow must preserve existing user_content files while allowing new templates.'); failed = true;
}
if (!unpack.includes('Protected delete path rejected')) {
  console.error('Unpack deletion manifest must protect user_content and workflow metadata.'); failed = true;
}
const gameBundle = fs.readFileSync('scripts/release/package_game_bundle.sh','utf8');
if (!gameBundle.includes('zip -0 -X')) {
  console.error('Game patch pipeline must emit deterministic ZIP_STORE_V1 archives.'); failed = true;
}
const gamePatchWorkflow = fs.readFileSync('.github/workflows/game-patch.yml','utf8');
if (!gamePatchWorkflow.includes('audit_game_patch_zip.mjs')) {
  console.error('Game patch workflow must audit the exact ZIP it uploads.'); failed = true;
}
const releaseWorkflow = fs.readFileSync('.github/workflows/release.yml','utf8');
if (!releaseWorkflow.includes('FANTASYAC_LAUNCHER_UPDATE_MANIFEST_URL')) {
  console.error('Launcher auto-update channel must be explicit opt-in for private repositories.'); failed = true;
}
const stampLauncher = fs.readFileSync('scripts/release/stamp_release_channel.mjs','utf8');
if (!stampLauncher.includes("url || '(disabled)'")) {
  console.error('Launcher release channel stamper must allow an intentionally disabled channel.'); failed = true;
}

const packageJson = JSON.parse(fs.readFileSync('package.json','utf8'));
const appVersionText = fs.readFileSync('src/runtime/version.ts','utf8');
const gameVersionText = fs.readFileSync('src/runtime/gameVersion.ts','utf8');
if (!appVersionText.includes(`'${packageJson.version}'`) && !appVersionText.includes(`"${packageJson.version}"`)) {
  console.error('package.json and src/runtime/version.ts must use the same app version.'); failed = true;
}
if (!gameVersionText.includes(`"${packageJson.version}.0"`) && !gameVersionText.includes(`'${packageJson.version}.0'`)) {
  console.error('game content version must follow <appVersion>.0 for the 4.0 patch line.'); failed = true;
}
const androidManifest = fs.readFileSync('native/android/app/src/main/AndroidManifest.xml','utf8');
if (!androidManifest.includes('android:usesCleartextTraffic="false"')) {
  console.error('Android launcher should not permit cleartext traffic.'); failed = true;
}
if (failed) process.exit(1);
console.log('release tree OK');
