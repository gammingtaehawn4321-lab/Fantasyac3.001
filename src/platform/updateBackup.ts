import { createSaveBackupBundle } from '../services/saveService';
import { getFantasyacNativeBridge } from './nativeBridge';

export interface PreparedUpdateBackup {
  ok: boolean;
  location?: string;
  mode: 'NATIVE' | 'DOWNLOAD';
  error?: string;
}

function makeName(): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `fantasyac_pre_update_${stamp}.json`;
}

function downloadTextFile(text: string, name: string) {
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function prepareAutomaticUpdateBackup(): Promise<PreparedUpdateBackup> {
  try {
    const bundle = await createSaveBackupBundle();
    const json = JSON.stringify(bundle, null, 2);
    const name = makeName();
    const native = getFantasyacNativeBridge();
    if (native?.saveUpdateBackup) {
      const result = await native.saveUpdateBackup(json, name);
      if (!result.ok) throw new Error(result.error || '네이티브 백업 저장 실패');
      return { ok: true, mode: 'NATIVE', location: result.path };
    }
    downloadTextFile(json, name);
    return { ok: true, mode: 'DOWNLOAD', location: name };
  } catch (error: any) {
    return { ok: false, mode: getFantasyacNativeBridge() ? 'NATIVE' : 'DOWNLOAD', error: String(error?.message || error) };
  }
}
