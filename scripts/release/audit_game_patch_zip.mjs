import fs from 'node:fs';
import path from 'node:path';

const zipPath = path.resolve(process.argv[2] || '');
if (!zipPath || !fs.existsSync(zipPath)) throw new Error(`game patch ZIP not found: ${zipPath}`);
const data = fs.readFileSync(zipPath);
const MAX_ARCHIVE = 512 * 1024 * 1024;
const MAX_EXTRACTED = 1024 * 1024 * 1024;
const MAX_ENTRIES = 50_000;
if (data.length < 22) throw new Error('game patch ZIP is too small');
if (data.length > MAX_ARCHIVE) throw new Error('game patch ZIP exceeds 512 MiB');

const u16 = (o) => data.readUInt16LE(o);
const u32 = (o) => data.readUInt32LE(o);
function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

let offset = 0;
let count = 0;
let extracted = 0;
let reachedCentralDirectory = false;
const names = new Set();
const bodies = new Map();
while (offset + 4 <= data.length) {
  const sig = u32(offset);
  if (sig === 0x02014b50 || sig === 0x06054b50) {
    reachedCentralDirectory = true;
    break;
  }
  if (sig !== 0x04034b50) throw new Error(`unexpected ZIP signature 0x${sig.toString(16)} at ${offset}`);
  if (offset + 30 > data.length) throw new Error('truncated local ZIP header');
  count += 1;
  if (count > MAX_ENTRIES) throw new Error('game patch ZIP has too many entries');

  const flags = u16(offset + 6);
  const method = u16(offset + 8);
  const expectedCrc = u32(offset + 14);
  const compressedSize = u32(offset + 18);
  const uncompressedSize = u32(offset + 22);
  const nameLen = u16(offset + 26);
  const extraLen = u16(offset + 28);
  if (flags & 0x0001) throw new Error('encrypted ZIP entry found');
  if (flags & 0x0008) throw new Error('data-descriptor ZIP entry found; iOS launcher requires fixed local sizes');
  if (method !== 0) throw new Error(`compressed ZIP method ${method} found; ZIP_STORE_V1 requires store method`);
  if (compressedSize !== uncompressedSize) throw new Error('stored ZIP size mismatch');

  const nameStart = offset + 30;
  const nameEnd = nameStart + nameLen;
  const bodyStart = nameEnd + extraLen;
  const bodyEnd = bodyStart + compressedSize;
  if (nameEnd > data.length || bodyEnd > data.length) throw new Error('truncated ZIP entry');

  const rawName = data.subarray(nameStart, nameEnd).toString('utf8');
  if (!rawName || rawName.includes('\0')) throw new Error('invalid ZIP entry name');
  const normalizedInput = rawName.replaceAll('\\', '/');
  if (normalizedInput.startsWith('/') || normalizedInput.split('/').includes('..')) throw new Error(`unsafe ZIP path: ${rawName}`);
  const normalized = path.posix.normalize(normalizedInput);
  if (normalized === '..' || normalized.startsWith('../')) throw new Error(`unsafe ZIP path: ${rawName}`);
  if (names.has(normalized)) throw new Error(`duplicate ZIP entry: ${normalized}`);
  names.add(normalized);

  extracted += uncompressedSize;
  if (extracted > MAX_EXTRACTED) throw new Error('game patch ZIP expands beyond 1 GiB');
  const body = data.subarray(bodyStart, bodyEnd);
  if (crc32(body) !== expectedCrc) throw new Error(`CRC mismatch: ${normalized}`);
  if (!normalized.endsWith('/')) bodies.set(normalized, body);
  offset = bodyEnd;
}
if (!count) throw new Error('game patch ZIP has no local entries');
if (!reachedCentralDirectory) throw new Error('game patch ZIP central directory was not reached');
for (const required of ['index.html', 'game-runtime.json', 'game-patch.json']) {
  if (!bodies.has(required)) throw new Error(`game patch ZIP missing ${required}`);
}
const eocd = data.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
if (eocd < 0 || eocd < data.length - 65557) throw new Error('ZIP EOCD missing');

const runtime = JSON.parse(bodies.get('game-runtime.json').toString('utf8'));
const patch = JSON.parse(bodies.get('game-patch.json').toString('utf8'));
if (runtime?.schemaVersion !== 1 || !runtime?.gameVersion) throw new Error('invalid game-runtime.json');
if (patch?.schemaVersion !== 1 || !patch?.gameVersion || !patch?.minimumLauncherVersion) throw new Error('invalid game-patch.json');
if (patch.format !== 'ZIP_STORE_V1') throw new Error(`unexpected game patch format: ${patch.format}`);
if (String(runtime.gameVersion) !== String(patch.gameVersion)) throw new Error('game-runtime.json and game-patch.json versions differ');

console.log(`game patch ZIP OK: ${count} entries, ${(data.length / 1024 / 1024).toFixed(2)} MiB, game ${patch.gameVersion}`);
