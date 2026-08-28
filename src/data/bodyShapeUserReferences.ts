import type { BreastSizeType, HipSizeType, CharacterProfile } from '../types';

/**
 * UI 표기명은 고정이지만, Gemini가 실제 묘사에 참고할 문자열은 사용자가 직접 작성한다.
 * 빈 문자열은 Gemini 프롬프트에 포함하지 않는다.
 */
export const BREAST_SIZE_LABELS: Record<BreastSizeType, string> = {
  SMALL: '빈유',
  SLENDER: '슬렌더형',
  LARGE: '거유',
};

export const HIP_SIZE_LABELS: Record<HipSizeType, string> = {
  SLIM: '부실함',
  AVERAGE: '적당함',
  FULL: '풍만함',
};

/** [USER_TODO] 선택값별 Gemini 참조 문구. 기본값은 전부 공란. */
export const BREAST_SIZE_GEMINI_REFERENCES: Record<BreastSizeType, string> = {
  SMALL: '',
  SLENDER: '',
  LARGE: '',
};

/** [USER_TODO] 선택값별 Gemini 참조 문구. 기본값은 전부 공란. */
export const HIP_SIZE_GEMINI_REFERENCES: Record<HipSizeType, string> = {
  SLIM: '',
  AVERAGE: '',
  FULL: '',
};

export function collectBodyShapeGeminiReferences(profile: Partial<CharacterProfile> | undefined): string[] {
  if (!profile || Number(profile.physicalAge ?? 0) < 18) return [];
  const output: string[] = [];
  if (profile.breastSize) {
    const ref = BREAST_SIZE_GEMINI_REFERENCES[profile.breastSize]?.trim();
    if (ref) output.push(ref);
  }
  if (profile.hipSize) {
    const ref = HIP_SIZE_GEMINI_REFERENCES[profile.hipSize]?.trim();
    if (ref) output.push(ref);
  }
  return output;
}
