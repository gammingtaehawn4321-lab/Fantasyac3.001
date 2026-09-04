import type { NarrationRequest, NarrationResult } from '../ai/narratorTypes';
import { detectFantasyacPlatform } from './platformRuntime';

export interface NativeLocalAIStatus {
  available: boolean;
  loaded: boolean;
  modelId?: string;
  detail?: string;
}

export interface NativeGeminiKeyStatus {
  configured: boolean;
  provider?: string;
}

export interface NativeModelFileInfo {
  id: string;
  fileName: string;
  sizeBytes: number;
  active: boolean;
}

export interface NativeModelDownloadStatus {
  jobId: string;
  state: 'QUEUED' | 'DOWNLOADING' | 'COMPLETED' | 'FAILED';
  bytesDownloaded: number;
  totalBytes?: number;
  modelId?: string;
  error?: string;
}

export interface NativeModelImportResult {
  ok: boolean;
  modelId?: string;
  fileName?: string;
  error?: string;
}


export interface NativeGameContentStatus {
  available: boolean;
  gameVersion: string;
  launcherVersion: string;
  source?: 'BUNDLED' | 'DOWNLOADED' | 'RECOVERED' | 'UNKNOWN';
  canSelfUpdate: boolean;
  currentPath?: string;
  error?: string;
  pendingHealthCheck?: boolean;
  hasPrevious?: boolean;
}

export interface NativeGameContentUpdateResult {
  ok: boolean;
  gameVersion?: string;
  previousGameVersion?: string;
  rolledBack?: boolean;
  error?: string;
  pending?: boolean;
}

export interface NativeUpdateBackupResult {
  ok: boolean;
  path?: string;
  error?: string;
}

export interface FantasyacNativeBridge {
  platform?: string;
  getLocalAIStatus?: () => Promise<NativeLocalAIStatus> | NativeLocalAIStatus;
  getGeminiKeyStatus?: () => Promise<NativeGeminiKeyStatus> | NativeGeminiKeyStatus;
  listLocalModels?: () => Promise<{ models: NativeModelFileInfo[]; activeModelId?: string }> | { models: NativeModelFileInfo[]; activeModelId?: string };
  startModelDownload?: (modelId: string, url: string, fileName: string) => Promise<{ ok: boolean; jobId?: string; error?: string }> | { ok: boolean; jobId?: string; error?: string };
  getModelDownloadStatus?: (jobId: string) => Promise<NativeModelDownloadStatus> | NativeModelDownloadStatus;
  importLocalModel?: () => Promise<NativeModelImportResult> | NativeModelImportResult;
  activateLocalModel?: (modelId: string, presetId: string) => Promise<{ ok: boolean; error?: string }> | { ok: boolean; error?: string };
  deleteLocalModel?: (modelId: string) => Promise<{ ok: boolean; error?: string }> | { ok: boolean; error?: string };
  fetchRemoteText?: (url: string) => Promise<string> | string;
  setGeminiApiKey?: (apiKey: string) => Promise<{ ok: boolean; error?: string }> | { ok: boolean; error?: string };
  clearGeminiApiKey?: () => Promise<void> | void;
  generateGeminiInterpretation?: (requestJson: string) => Promise<string> | string;
  generateLocalNarration?: (requestJson: string) => Promise<string> | string;
  cancelLocalNarration?: () => Promise<void> | void;
  saveUpdateBackup?: (json: string, suggestedName: string) => Promise<NativeUpdateBackupResult> | NativeUpdateBackupResult;
  openExternalUrl?: (url: string) => Promise<void> | void;
  getAppDataPath?: () => Promise<string> | string;
  getGameContentStatus?: () => Promise<NativeGameContentStatus> | NativeGameContentStatus;
  applyGameContentUpdate?: (manifestJson: string) => Promise<NativeGameContentUpdateResult> | NativeGameContentUpdateResult;
  importGameContentUpdate?: () => Promise<NativeGameContentUpdateResult> | NativeGameContentUpdateResult;
  reloadGameContent?: () => Promise<void> | void;
  rollbackGameContent?: () => Promise<NativeGameContentUpdateResult> | NativeGameContentUpdateResult;
  confirmGameContentHealthy?: () => Promise<void> | void;
}

declare global {
  interface Window {
    fantasyacNative?: FantasyacNativeBridge;
    AndroidFantasyac?: {
      getLocalAIStatus?: () => string;
      getGeminiKeyStatus?: () => string;
      listLocalModels?: () => string;
      startModelDownload?: (modelId: string, url: string, fileName: string) => string;
      getModelDownloadStatus?: (jobId: string) => string;
      importLocalModel?: () => string;
      activateLocalModel?: (modelId: string, presetId: string) => string;
      deleteLocalModel?: (modelId: string) => string;
      fetchRemoteText?: (url: string) => string;
      setGeminiApiKey?: (apiKey: string) => string;
      clearGeminiApiKey?: () => void;
      generateGeminiInterpretation?: (requestJson: string) => string;
      generateLocalNarration?: (requestJson: string) => string;
      cancelLocalNarration?: () => void;
      saveUpdateBackup?: (json: string, suggestedName: string) => string;
      openExternalUrl?: (url: string) => void;
      getAppDataPath?: () => string;
      getGameContentStatus?: () => string;
      applyGameContentUpdate?: (manifestJson: string) => string;
      importGameContentUpdate?: () => string;
      reloadGameContent?: () => void;
      rollbackGameContent?: () => string;
      confirmGameContentHealthy?: () => void;
    };
    webkit?: {
      messageHandlers?: Record<string, { postMessage: (payload: unknown) => void }>;
    };
  }
}

function parseJsonSafe<T>(raw: unknown, fallback: T): T {
  try {
    if (typeof raw === 'string') return JSON.parse(raw) as T;
    if (raw && typeof raw === 'object') return raw as T;
  } catch {}
  return fallback;
}

function androidBridge(): FantasyacNativeBridge | null {
  if (typeof window === 'undefined' || !window.AndroidFantasyac) return null;
  const b = window.AndroidFantasyac;
  return {
    platform: 'ANDROID',
    getLocalAIStatus: () => parseJsonSafe(b.getLocalAIStatus?.(), { available: false, loaded: false }),
    getGeminiKeyStatus: () => parseJsonSafe(b.getGeminiKeyStatus?.(), { configured: false }),
    listLocalModels: () => parseJsonSafe(b.listLocalModels?.(), { models: [] }),
    startModelDownload: (modelId, url, fileName) => parseJsonSafe(b.startModelDownload?.(modelId, url, fileName), { ok: false, error: 'Android model download bridge unavailable' }),
    getModelDownloadStatus: (jobId) => parseJsonSafe(b.getModelDownloadStatus?.(jobId), { jobId, state: 'FAILED', bytesDownloaded: 0, error: 'Android download status unavailable' }),
    importLocalModel: () => parseJsonSafe(b.importLocalModel?.(), { ok: false, error: 'Android model import unavailable' }),
    activateLocalModel: (modelId, presetId) => parseJsonSafe(b.activateLocalModel?.(modelId, presetId), { ok: false, error: 'Android model activation unavailable' }),
    deleteLocalModel: (modelId) => parseJsonSafe(b.deleteLocalModel?.(modelId), { ok: false, error: 'Android model delete unavailable' }),
    fetchRemoteText: (url) => String(b.fetchRemoteText?.(url) || ''),
    setGeminiApiKey: (apiKey) => parseJsonSafe(b.setGeminiApiKey?.(apiKey), { ok: false, error: 'Android secure key store unavailable' }),
    clearGeminiApiKey: () => b.clearGeminiApiKey?.(),
    generateGeminiInterpretation: (requestJson) => String(b.generateGeminiInterpretation?.(requestJson) || ''),
    generateLocalNarration: (requestJson) => String(b.generateLocalNarration?.(requestJson) || ''),
    cancelLocalNarration: () => b.cancelLocalNarration?.(),
    saveUpdateBackup: (json, name) => parseJsonSafe(b.saveUpdateBackup?.(json, name), { ok: false, error: 'Android backup bridge unavailable' }),
    openExternalUrl: (url) => b.openExternalUrl?.(url),
    getAppDataPath: () => String(b.getAppDataPath?.() || ''),
    getGameContentStatus: () => parseJsonSafe(b.getGameContentStatus?.(), { available: false, gameVersion: '', launcherVersion: '', canSelfUpdate: false }),
    applyGameContentUpdate: (manifestJson) => parseJsonSafe(b.applyGameContentUpdate?.(manifestJson), { ok: false, error: 'Android game updater unavailable' }),
    importGameContentUpdate: () => parseJsonSafe(b.importGameContentUpdate?.(), { ok: false, error: 'Android game patch import unavailable' }),
    reloadGameContent: () => b.reloadGameContent?.(),
    rollbackGameContent: () => parseJsonSafe(b.rollbackGameContent?.(), { ok: false, error: 'Android rollback unavailable' }),
    confirmGameContentHealthy: () => b.confirmGameContentHealthy?.(),
  };
}

let iosRequestCounter = 0;
const iosPending = new Map<string, { resolve: (value: any) => void; reject: (reason?: any) => void; timer?: ReturnType<typeof setTimeout> }>();

function installIOSCallback() {
  if (typeof window === 'undefined') return;
  (window as any).__fantasyacNativeResolve = (id: string, ok: boolean, payload: unknown) => {
    const pending = iosPending.get(id);
    if (!pending) return;
    iosPending.delete(id);
    if (pending.timer) clearTimeout(pending.timer);
    if (ok) pending.resolve(payload);
    else pending.reject(new Error(typeof payload === 'string' ? payload : 'Native bridge error'));
  };
}
installIOSCallback();

function iosCall<T>(name: string, payload: Record<string, unknown> = {}, timeoutMs: number | null = 180_000): Promise<T> {
  const handler = typeof window !== 'undefined' ? window.webkit?.messageHandlers?.fantasyac : undefined;
  if (!handler) return Promise.reject(new Error('iOS native bridge unavailable'));
  const id = `ios_${Date.now()}_${++iosRequestCounter}`;
  return new Promise<T>((resolve, reject) => {
    const pending: { resolve: (value: any) => void; reject: (reason?: any) => void; timer?: ReturnType<typeof setTimeout> } = { resolve, reject };
    if (timeoutMs !== null) {
      pending.timer = setTimeout(() => {
        const current = iosPending.get(id);
        if (!current) return;
        iosPending.delete(id);
        reject(new Error(`Native bridge timeout: ${name}`));
      }, timeoutMs);
    }
    iosPending.set(id, pending);
    try {
      handler.postMessage({ id, name, payload });
    } catch (error) {
      iosPending.delete(id);
      if (pending.timer) clearTimeout(pending.timer);
      reject(error);
    }
  });
}

function iosBridge(): FantasyacNativeBridge | null {
  if (typeof window === 'undefined' || !window.webkit?.messageHandlers?.fantasyac) return null;
  return {
    platform: detectFantasyacPlatform(),
    getLocalAIStatus: () => iosCall<NativeLocalAIStatus>('getLocalAIStatus'),
    getGeminiKeyStatus: () => iosCall<NativeGeminiKeyStatus>('getGeminiKeyStatus'),
    listLocalModels: () => iosCall<{ models: NativeModelFileInfo[]; activeModelId?: string }>('listLocalModels'),
    startModelDownload: (modelId, url, fileName) => iosCall<{ ok: boolean; jobId?: string; error?: string }>('startModelDownload', { modelId, url, fileName }),
    getModelDownloadStatus: (jobId) => iosCall<NativeModelDownloadStatus>('getModelDownloadStatus', { jobId }),
    importLocalModel: () => iosCall<NativeModelImportResult>('importLocalModel', {}, null),
    activateLocalModel: (modelId, presetId) => iosCall<{ ok: boolean; error?: string }>('activateLocalModel', { modelId, presetId }),
    deleteLocalModel: (modelId) => iosCall<{ ok: boolean; error?: string }>('deleteLocalModel', { modelId }),
    fetchRemoteText: async (url) => { const result = await iosCall<{ text: string }>('fetchRemoteText', { url }); return result.text; },
    setGeminiApiKey: (apiKey) => iosCall<{ ok: boolean; error?: string }>('setGeminiApiKey', { apiKey }),
    clearGeminiApiKey: () => iosCall<void>('clearGeminiApiKey'),
    generateGeminiInterpretation: async (requestJson) => {
      const result = await iosCall<{ text: string }>('generateGeminiInterpretation', { requestJson }, 600_000);
      return result.text;
    },
    generateLocalNarration: async (requestJson) => {
      const result = await iosCall<{ text: string }>('generateLocalNarration', { requestJson }, 900_000);
      return result.text;
    },
    cancelLocalNarration: () => iosCall<void>('cancelLocalNarration'),
    saveUpdateBackup: (json, suggestedName) => iosCall<NativeUpdateBackupResult>('saveUpdateBackup', { json, suggestedName }),
    openExternalUrl: (url) => iosCall<void>('openExternalUrl', { url }),
    getAppDataPath: () => iosCall<string>('getAppDataPath'),
    getGameContentStatus: () => iosCall<NativeGameContentStatus>('getGameContentStatus'),
    applyGameContentUpdate: (manifestJson) => iosCall<NativeGameContentUpdateResult>('applyGameContentUpdate', { manifestJson }, 600_000),
    importGameContentUpdate: () => iosCall<NativeGameContentUpdateResult>('importGameContentUpdate', {}, null),
    reloadGameContent: () => iosCall<void>('reloadGameContent'),
    rollbackGameContent: () => iosCall<NativeGameContentUpdateResult>('rollbackGameContent'),
    confirmGameContentHealthy: () => iosCall<void>('confirmGameContentHealthy'),
  };
}

export function getFantasyacNativeBridge(): FantasyacNativeBridge | null {
  if (typeof window === 'undefined') return null;
  if (window.fantasyacNative) return window.fantasyacNative;
  return androidBridge() || iosBridge();
}

export function hasNativeFantasyacBridge(): boolean {
  return Boolean(getFantasyacNativeBridge());
}

export async function generateNarrationViaNative(request: NarrationRequest): Promise<NarrationResult> {
  const bridge = getFantasyacNativeBridge();
  if (!bridge?.generateLocalNarration) throw new Error('Native local narrator is unavailable.');
  const raw = await bridge.generateLocalNarration(JSON.stringify(request));
  const parsed = parseJsonSafe<any>(raw, null);
  const text = parsed && typeof parsed.text === 'string' ? parsed.text : String(raw || '');
  if (!text.trim() || text.includes('__FANTASYAC_NATIVE_INFERENCE_NOT_PINNED__')) {
    throw new Error(parsed?.error || 'Native local narrator did not return a usable narration.');
  }
  return {
    requestId: request.requestId,
    text,
    provider: 'LOCAL',
    attempts: Number(parsed?.attempts) || 1,
    fallbackUsed: false,
  };
}
