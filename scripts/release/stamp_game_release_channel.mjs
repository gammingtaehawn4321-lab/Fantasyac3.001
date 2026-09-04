import fs from 'node:fs';
const value = String(process.argv[2] || '').trim();
let url = '';
if (/^https:\/\//i.test(value)) url = value;
else if (/^[^/\s]+\/[^/\s]+$/.test(value)) url = `https://github.com/${value}/releases/download/game-stable/game-update-manifest.json`;
fs.writeFileSync('src/runtime/gameReleaseChannel.ts', `/** Generated for release builds. */\nexport const FANTASYAC_DEFAULT_GAME_UPDATE_MANIFEST_URL = ${JSON.stringify(url)};\n`);
console.log(url || '(disabled)');
