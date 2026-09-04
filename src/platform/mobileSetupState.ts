const SETUP_KEY = 'fantasyac_mobile_setup_completed_v1';
const PRESET_KEY = 'fantasyac_mobile_ai_preset_v1';

export function isMobileSetupCompleted(): boolean {
  try { return localStorage.getItem(SETUP_KEY) === '1'; } catch { return false; }
}

export function markMobileSetupCompleted(completed = true): void {
  try {
    if (completed) localStorage.setItem(SETUP_KEY, '1');
    else localStorage.removeItem(SETUP_KEY);
  } catch {}
}

export function getStoredMobilePreset(): string {
  try { return localStorage.getItem(PRESET_KEY) || 'BALANCED'; } catch { return 'BALANCED'; }
}

export function setStoredMobilePreset(preset: string): void {
  try { localStorage.setItem(PRESET_KEY, preset); } catch {}
}
