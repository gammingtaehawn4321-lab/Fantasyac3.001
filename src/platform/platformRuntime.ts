export type FantasyacPlatform = 'WINDOWS' | 'MACOS' | 'LINUX' | 'ANDROID' | 'IPADOS' | 'IOS' | 'WEB';

function ua(): string {
  return typeof navigator === 'undefined' ? '' : navigator.userAgent || '';
}

export function detectFantasyacPlatform(): FantasyacPlatform {
  const value = ua();
  const lower = value.toLowerCase();
  const touchPoints = typeof navigator === 'undefined' ? 0 : Number(navigator.maxTouchPoints || 0);

  if (/android/i.test(value)) return 'ANDROID';
  // iPadOS 13+ can identify itself as Macintosh. maxTouchPoints separates iPad from Mac.
  if (/ipad/i.test(value) || (/macintosh/i.test(value) && touchPoints > 1)) return 'IPADOS';
  if (/iphone|ipod/i.test(value)) return 'IOS';
  if (lower.includes('windows')) return 'WINDOWS';
  if (lower.includes('mac os') || lower.includes('macintosh')) return 'MACOS';
  if (lower.includes('linux')) return 'LINUX';
  return 'WEB';
}

export function isNativeMobilePlatform(platform = detectFantasyacPlatform()): boolean {
  return platform === 'ANDROID' || platform === 'IPADOS' || platform === 'IOS';
}

export function getPlatformDisplayName(platform = detectFantasyacPlatform()): string {
  switch (platform) {
    case 'WINDOWS': return 'Windows';
    case 'MACOS': return 'macOS';
    case 'LINUX': return 'Linux';
    case 'ANDROID': return 'Android';
    case 'IPADOS': return 'iPadOS';
    case 'IOS': return 'iOS';
    default: return '웹';
  }
}
