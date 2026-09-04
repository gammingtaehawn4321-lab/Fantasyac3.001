import { getFantasyacNativeBridge, type NativeGameContentStatus, type NativeGameContentUpdateResult } from './nativeBridge';
import { getGameUpdateManifestUrl } from '../runtime/gameUpdateConfig';
import { prepareAutomaticUpdateBackup } from './updateBackup';

export interface FantasyacGameBundlePackage {
  url: string;
  sha256: string;
  sizeBytes?: number;
  format?: 'ZIP_STORE_V1' | 'ZIP_V1';
}

export interface FantasyacGameUpdateManifest {
  schemaVersion: number;
  gameVersion: string;
  minimumLauncherVersion: string;
  publishedAt?: string;
  notes?: string;
  bundle: FantasyacGameBundlePackage;
}

const MAX_GAME_PATCH_BYTES = 512 * 1024 * 1024;

export interface FantasyacGameUpdateStatus {
  enabled: boolean;
  runtime?: NativeGameContentStatus;
  manifest?: FantasyacGameUpdateManifest;
  currentGameVersion: string;
  latestGameVersion?: string;
  updateAvailable: boolean;
  launcherUpdateRequired: boolean;
  error?: string;
}

function numericVersion(value: string): number[] {
  return String(value || '')
    .replace(/^v/i, '')
    .split(/[.-]/)
    .map((part) => Number.parseInt(part, 10))
    .map((part) => (Number.isFinite(part) ? part : 0));
}

export function compareFantasyacVersions(a: string, b: string): number {
  const pa = numericVersion(a);
  const pb = numericVersion(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const delta = (pa[i] || 0) - (pb[i] || 0);
    if (delta) return delta;
  }
  return 0;
}

function validateManifest(value: any): FantasyacGameUpdateManifest {
  if (!value || typeof value !== 'object') throw new Error('게임 업데이트 manifest 형식이 올바르지 않습니다.');
  const gameVersion = String(value.gameVersion || '').trim();
  const minimumLauncherVersion = String(value.minimumLauncherVersion || '').trim();
  const bundle = value.bundle || {};
  const url = String(bundle.url || '').trim();
  const sha256 = String(bundle.sha256 || '').trim().toLowerCase();
  const schemaVersion = Number(value.schemaVersion || 0);
  const sizeBytes = Number(bundle.sizeBytes);
  const format = String(bundle.format || '').trim();
  if (schemaVersion !== 1) throw new Error(`지원하지 않는 게임 업데이트 manifest 버전입니다: ${schemaVersion || '없음'}`);
  if (!gameVersion) throw new Error('게임 업데이트 manifest에 gameVersion이 없습니다.');
  if (!minimumLauncherVersion) throw new Error('게임 업데이트 manifest에 minimumLauncherVersion이 없습니다.');
  if (!/^https:\/\//i.test(url)) throw new Error('게임 패치 URL은 HTTPS여야 합니다.');
  if (!/^[a-f0-9]{64}$/i.test(sha256)) throw new Error('게임 패치 SHA-256이 없거나 올바르지 않습니다.');
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_GAME_PATCH_BYTES) {
    throw new Error('게임 패치 크기 정보가 없거나 허용 범위를 벗어났습니다.');
  }
  if (format !== 'ZIP_STORE_V1') throw new Error(`지원하지 않는 게임 패치 형식입니다: ${format || '없음'}`);
  return {
    schemaVersion,
    gameVersion,
    minimumLauncherVersion,
    publishedAt: value.publishedAt ? String(value.publishedAt) : undefined,
    notes: value.notes ? String(value.notes) : undefined,
    bundle: {
      url,
      sha256,
      sizeBytes,
      format: 'ZIP_STORE_V1',
    },
  };
}

export async function fetchFantasyacGameUpdateStatus(): Promise<FantasyacGameUpdateStatus> {
  const native = getFantasyacNativeBridge();
  if (!native?.getGameContentStatus || !native?.applyGameContentUpdate) {
    return { enabled: false, currentGameVersion: '', updateAvailable: false, launcherUpdateRequired: false };
  }

  const runtime = await native.getGameContentStatus();
  const currentGameVersion = String(runtime?.gameVersion || '0');
  const manifestUrl = getGameUpdateManifestUrl();
  if (!manifestUrl) {
    return {
      enabled: false,
      runtime,
      currentGameVersion,
      updateAvailable: false,
      launcherUpdateRequired: false,
    };
  }

  try {
    const raw = native.fetchRemoteText
      ? await native.fetchRemoteText(manifestUrl)
      : await (await fetch(manifestUrl, { cache: 'no-store', headers: { Accept: 'application/json' } })).text();
    const manifest = validateManifest(JSON.parse(raw));
    const launcherUpdateRequired = compareFantasyacVersions(manifest.minimumLauncherVersion, runtime.launcherVersion || '0') > 0;
    return {
      enabled: true,
      runtime,
      manifest,
      currentGameVersion,
      latestGameVersion: manifest.gameVersion,
      updateAvailable: !launcherUpdateRequired && compareFantasyacVersions(manifest.gameVersion, currentGameVersion) > 0,
      launcherUpdateRequired,
    };
  } catch (error: any) {
    return {
      enabled: true,
      runtime,
      currentGameVersion,
      updateAvailable: false,
      launcherUpdateRequired: false,
      error: String(error?.message || error),
    };
  }
}

export interface ApplyFantasyacGameUpdateResult extends NativeGameContentUpdateResult {
  backupPath?: string;
}

export async function applyFantasyacGameUpdate(manifest: FantasyacGameUpdateManifest): Promise<ApplyFantasyacGameUpdateResult> {
  const native = getFantasyacNativeBridge();
  if (!native?.applyGameContentUpdate) return { ok: false, error: '이 실행 환경은 게임 자체 업데이트를 지원하지 않습니다.' };

  const backup = await prepareAutomaticUpdateBackup();
  if (!backup.ok) return { ok: false, error: `업데이트 전 세이브 백업 실패: ${backup.error || '알 수 없는 오류'}` };

  const result = await native.applyGameContentUpdate(JSON.stringify(manifest));
  if (!result.ok) return { ...result, backupPath: backup.location };
  return { ...result, backupPath: backup.location };
}

export async function reloadFantasyacGameContent(): Promise<void> {
  const native = getFantasyacNativeBridge();
  if (native?.reloadGameContent) await native.reloadGameContent();
  else window.location.reload();
}

export async function rollbackFantasyacGameContent(): Promise<NativeGameContentUpdateResult> {
  const native = getFantasyacNativeBridge();
  if (!native?.rollbackGameContent) return { ok: false, error: '이 실행 환경은 게임 롤백을 지원하지 않습니다.' };
  return native.rollbackGameContent();
}
