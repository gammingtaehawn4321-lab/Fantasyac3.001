import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

const [gameVersionRaw, minimumLauncherVersion, repo, tagRaw, outDirRaw] = process.argv.slice(2);
if (!gameVersionRaw || !minimumLauncherVersion || !repo || !tagRaw || !outDirRaw) {
  console.error('usage: node generate_game_manifest.mjs <gameVersion> <minimumLauncherVersion> <owner/repo> <tag> <asset-dir>');
  process.exit(2);
}
const gameVersion = gameVersionRaw.replace(/^v/i, '');
const tag = tagRaw;
const outDir = path.resolve(outDirRaw);
const assetName = `Fantasyac-Game-v${gameVersion}.zip`;
const assetPath = path.join(outDir, assetName);
if (!fs.existsSync(assetPath)) throw new Error(`missing game bundle: ${assetPath}`);
const sha256 = crypto.createHash('sha256').update(fs.readFileSync(assetPath)).digest('hex');
const manifest = {
  schemaVersion: 1,
  gameVersion,
  minimumLauncherVersion,
  publishedAt: new Date().toISOString(),
  notes: `Fantasyac game/content patch ${gameVersion}`,
  bundle: {
    format: 'ZIP_STORE_V1',
    url: `https://github.com/${repo}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(assetName)}`,
    sha256,
    sizeBytes: fs.statSync(assetPath).size,
  },
};
const output = path.join(outDir, 'game-update-manifest.json');
fs.writeFileSync(output, JSON.stringify(manifest, null, 2) + '\n');
console.log(output);
