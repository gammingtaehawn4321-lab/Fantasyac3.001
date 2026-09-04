import { FANTASYAC_DEFAULT_GAME_UPDATE_MANIFEST_URL } from './gameReleaseChannel';

/**
 * Game-content update source. This is deliberately independent from the APK/IPA/EXE update channel.
 * A developer/test URL can be set with localStorage key `fantasyac_game_update_manifest_url`.
 */
export function getGameUpdateManifestUrl(): string {
  try {
    const local = localStorage.getItem('fantasyac_game_update_manifest_url');
    if (local?.trim()) return local.trim();
  } catch {}
  return String(
    import.meta.env.VITE_FANTASYAC_GAME_UPDATE_MANIFEST_URL ||
    FANTASYAC_DEFAULT_GAME_UPDATE_MANIFEST_URL ||
    '',
  ).trim();
}
