import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

const [versionArg, repo, tagArg, outDirArg] = process.argv.slice(2);
if (!versionArg || !repo || !tagArg || !outDirArg) {
  console.error('usage: node scripts/release/generate_manifest.mjs <version> <owner/repo> <tag> <asset-dir>');
  process.exit(2);
}
const version = versionArg.replace(/^v/, '');
const tag = tagArg.startsWith('v') ? tagArg : `v${tagArg}`;
const outDir = path.resolve(outDirArg);
const base = `https://github.com/${repo}/releases/download/${encodeURIComponent(tag)}`;
const names = {
  WINDOWS: `Fantasyac-Windows-v${version}.zip`,
  ANDROID: `Fantasyac-Android-v${version}.apk`,
  IPADOS: `Fantasyac-iPadOS-v${version}.ipa`,
  IOS: `Fantasyac-iOS-v${version}.ipa`,
};
function sha(file) {
  if (!fs.existsSync(file)) return '';
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}
const packages = {};
for (const [platform, name] of Object.entries(names)) {
  const file = path.join(outDir, name);
  if (!fs.existsSync(file)) continue;
  packages[platform] = { url: `${base}/${encodeURIComponent(name)}`, sha256: sha(file) };
}
const manifest = {
  version,
  publishedAt: new Date().toISOString(),
  notes: `Fantasyac ${version}`,
  minimumSaveSchema: 1,
  packages,
};
const output = path.join(outDir, 'update-manifest.json');
fs.writeFileSync(output, JSON.stringify(manifest, null, 2) + '\n');
console.log(output);
