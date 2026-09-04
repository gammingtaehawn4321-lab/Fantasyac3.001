import { FANTASYAC_DEFAULT_UPDATE_MANIFEST_URL } from './releaseChannel';
/**
 * Native/standalone update source.
 * Set VITE_FANTASYAC_UPDATE_MANIFEST_URL at build time, or save a testing URL in
 * localStorage key `fantasyac_update_manifest_url`. An empty URL disables native
 * automatic update checks without affecting play/save data.
 */
export function getStandaloneUpdateManifestUrl(): string {
  try {
    const local = localStorage.getItem('fantasyac_update_manifest_url');
    if (local?.trim()) return local.trim();
  } catch {}
  return String(import.meta.env.VITE_FANTASYAC_UPDATE_MANIFEST_URL || FANTASYAC_DEFAULT_UPDATE_MANIFEST_URL || '').trim();
}
