import fs from 'node:fs';

const version = String(process.argv[2] || '').replace(/^v/i, '').trim();
if (!/^\d+(?:\.\d+){2,3}(?:[-+][A-Za-z0-9.-]+)?$/.test(version)) {
  throw new Error(`invalid game version: ${version}`);
}
fs.writeFileSync('src/runtime/gameVersion.ts', `/** Generated for a game-content build. */\nexport const FANTASYAC_GAME_VERSION = ${JSON.stringify(version)};\n`);
fs.mkdirSync('public', { recursive: true });
fs.writeFileSync('public/game-runtime.json', JSON.stringify({ schemaVersion: 1, gameVersion: version, builtAt: new Date().toISOString() }, null, 2) + '\n');
console.log(version);
