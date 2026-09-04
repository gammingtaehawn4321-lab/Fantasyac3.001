import fs from 'node:fs';
const url = String(process.argv[2] || '').trim();
if (url && !/^https:\/\//.test(url)) throw new Error('launcher update manifest URL must be HTTPS or blank');
fs.writeFileSync('src/runtime/releaseChannel.ts', `/** Generated for release builds. */\nexport const FANTASYAC_DEFAULT_UPDATE_MANIFEST_URL = ${JSON.stringify(url)};\n`);
console.log(url || '(disabled)');
