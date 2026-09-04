const META_PATTERNS = [
  /```/,
  /<\/?think>/i,
  /\b(system prompt|assistant|language model|policy)\b/i,
  /\bAI\b/,
  /프롬프트/,
  /정책상/,
  /모델(?:은|이|의)/,
];

// 실제 플레이에서 관측된 hot. 같은 독립 영문 파편을 포함한 흔한 생성 찌꺼기.
const STRAY_ENGLISH = /(^|[\s.!?])(?:hot|not|yes|no|okay|error|warning)\.(?=\s|$)/i;

export function validateNarration(text: string): { ok: boolean; reason?: string } {
  const normalized = String(text || '').trim();
  if (normalized.length < 20) return { ok: false, reason: 'too_short' };
  if (normalized.startsWith('{') || normalized.startsWith('[')) {
    return { ok: false, reason: 'structured_output' };
  }
  if (META_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return { ok: false, reason: 'meta_text' };
  }
  if (STRAY_ENGLISH.test(normalized)) {
    return { ok: false, reason: 'stray_english_fragment' };
  }
  return { ok: true };
}
