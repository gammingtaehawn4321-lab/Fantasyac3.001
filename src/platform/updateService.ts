import { FANTASYAC_APP_VERSION } from '../runtime/version';
import { detectFantasyacPlatform, FantasyacPlatform } from './platformRuntime';
import { getFantasyacNativeBridge, hasNativeFantasyacBridge } from './nativeBridge';
import { getStandaloneUpdateManifestUrl } from '../runtime/updateConfig';

export interface PlatformUpdatePackage {
  url: string;
  sha256?: string;
  sizeBytes?: number;
  notes?: string;
}

export interface FantasyacUpdateManifest {
  version: string;
  publishedAt?: string;
  notes?: string;
  minimumSaveSchema?: number;
  packages?: Partial<Record<FantasyacPlatform, PlatformUpdatePackage>>;
}


const MAX_LAUNCHER_PACKAGE_BYTES = 2 * 1024 * 1024 * 1024;

function validateLauncherUpdateManifest(value: any): FantasyacUpdateManifest {
  if (!value || typeof value !== 'object') throw new Error('업데이트 manifest 형식이 올바르지 않습니다.');
  const version = String(value.version || '').trim();
  if (!/^\d+(?:\.\d+){2,3}(?:[-+][A-Za-z0-9.-]+)?$/.test(version)) {
    throw new Error('업데이트 manifest의 version이 올바르지 않습니다.');
  }
  const packages: Partial<Record<FantasyacPlatform, PlatformUpdatePackage>> = {};
  const rawPackages = value.packages && typeof value.packages === 'object' ? value.packages : {};
  const supported: FantasyacPlatform[] = ['WINDOWS', 'ANDROID', 'IPADOS', 'IOS', 'MACOS', 'LINUX', 'WEB'];
  for (const platform of supported) {
    const raw = rawPackages[platform];
    if (!raw) continue;
    const url = String(raw.url || '').trim();
    if (!/^https:\/\//i.test(url)) throw new Error(`${platform} 업데이트 URL은 HTTPS여야 합니다.`);
    const sha256 = raw.sha256 == null ? undefined : String(raw.sha256).trim().toLowerCase();
    if (sha256 && !/^[a-f0-9]{64}$/.test(sha256)) throw new Error(`${platform} 업데이트 SHA-256 형식이 올바르지 않습니다.`);
    const sizeBytes = raw.sizeBytes == null ? undefined : Number(raw.sizeBytes);
    if (sizeBytes != null && (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_LAUNCHER_PACKAGE_BYTES)) {
      throw new Error(`${platform} 업데이트 파일 크기 정보가 허용 범위를 벗어났습니다.`);
    }
    packages[platform] = {
      url,
      sha256,
      sizeBytes,
      notes: raw.notes == null ? undefined : String(raw.notes),
    };
  }
  return {
    version,
    publishedAt: value.publishedAt == null ? undefined : String(value.publishedAt),
    notes: value.notes == null ? undefined : String(value.notes),
    minimumSaveSchema: value.minimumSaveSchema == null ? undefined : Number(value.minimumSaveSchema),
    packages,
  };
}
export interface FantasyacUpdateStatus {
  enabled: boolean;
  currentVersion: string;
  latestVersion?: string;
  updateAvailable: boolean;
  manifest?: FantasyacUpdateManifest;
  error?: string;
}

function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/i, '').split(/[.-]/).map((x) => Number.parseInt(x, 10) || 0);
  const pb = b.replace(/^v/i, '').split(/[.-]/).map((x) => Number.parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}

export async function fetchFantasyacUpdateStatus(signal?: AbortSignal): Promise<FantasyacUpdateStatus> {
  if (hasNativeFantasyacBridge()) {
    const manifestUrl = getStandaloneUpdateManifestUrl();
    if (!manifestUrl) return { enabled: false, currentVersion: FANTASYAC_APP_VERSION, updateAvailable: false };
    const native = getFantasyacNativeBridge();
    const raw = native?.fetchRemoteText
      ? await native.fetchRemoteText(manifestUrl)
      : await (async () => {
          const response = await fetch(manifestUrl, { signal, cache: 'no-store', headers: { Accept: 'application/json' } });
          if (!response.ok) throw new Error(`업데이트 manifest 확인 실패 (${response.status})`);
          return response.text();
        })();
    const manifest = validateLauncherUpdateManifest(JSON.parse(raw));
    return {
      enabled: true,
      currentVersion: FANTASYAC_APP_VERSION,
      latestVersion: String(manifest.version),
      updateAvailable: compareVersions(String(manifest.version), FANTASYAC_APP_VERSION) > 0,
      manifest,
    };
  }

  const response = await fetch('/api/update/status', { signal, headers: { Accept: 'application/json' } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error || `업데이트 확인 실패 (${response.status})`);
  const manifest = payload.manifest ? validateLauncherUpdateManifest(payload.manifest) : undefined;
  return {
    enabled: Boolean(payload.enabled),
    currentVersion: String(payload.currentVersion || FANTASYAC_APP_VERSION),
    latestVersion: payload.latestVersion ? String(payload.latestVersion) : manifest?.version,
    updateAvailable: Boolean(payload.updateAvailable),
    manifest,
    error: payload.error,
  };
}

export function getCurrentPlatformUpdatePackage(
  status: FantasyacUpdateStatus,
  platform: FantasyacPlatform = detectFantasyacPlatform(),
): PlatformUpdatePackage | undefined {
  return status.manifest?.packages?.[platform];
}

export function getUpdateInstallGuidance(platform = detectFantasyacPlatform()): string {
  switch (platform) {
    case 'WINDOWS':
      return '업데이트 패키지를 내려받아 런처가 프로그램 파일만 교체합니다. 사용자 세이브와 사용자 콘텐츠는 보존됩니다.';
    case 'ANDROID':
      return '이 항목은 런처/네이티브 엔진 업데이트입니다. 일반 게임·AI 지시문 패치는 앱 안에서 별도로 적용됩니다.';
    case 'IPADOS':
    case 'IOS':
      return '이 항목은 런처/네이티브 엔진 업데이트입니다. 일반 게임·AI 지시문 패치는 앱 안에서 별도로 적용됩니다.';
    case 'MACOS':
    case 'LINUX':
      return '새 프로그램 파일만 교체하고 사용자 데이터 디렉터리는 그대로 유지합니다.';
    default:
      return '웹 실행본에서는 직접 프로그램 교체가 불가능합니다. 동일한 설치 앱 또는 로컬 실행본의 업데이트 기능을 사용하세요.';
  }
}
